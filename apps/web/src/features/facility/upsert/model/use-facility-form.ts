'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import type { Facility } from '@/shared/api';
import { FACILITY_FORM_STEPS, STEP_FIELDS } from '../config/steps';
import type { FacilityFormStep } from '../config/steps';
import { EMPTY_FACILITY_VALUES, toFormValues } from './form-values';
import type { FacilityFormValues } from './form-values';
import { EIN_EXISTS_MESSAGE, isEinConflict } from './is-ein-conflict';
import { useUpsertFacility } from './use-upsert-facility';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export interface UseFacilityFormOptions {
  /** Edit this facility; omit to create a new one. */
  facility?: Facility;
  /** Called after a successful save. */
  onDone: () => void;
}

/**
 * State of the 3-step facility form. Create runs steps 1 → 3. Edit starts at
 * step 2, because the API can't change `ein`, `permit` or `npi`.
 */
export function useFacilityForm({ facility, onDone }: UseFacilityFormOptions) {
  const mode = facility ? 'edit' : 'create';
  const minStep: FacilityFormStep = facility ? 2 : 1;

  // `onChange`: an error set by `trigger()` on Next clears as soon as the field
  // is valid. (`reValidateMode` only applies after a full submit.)
  const form = useForm<FacilityFormValues>({
    mode: 'onChange',
    defaultValues: facility ? toFormValues(facility) : EMPTY_FACILITY_VALUES,
  });
  const [step, setStep] = useState<FacilityFormStep>(minStep);
  const { submit, isPending, error } = useUpsertFacility({
    facilityId: facility?.id,
    onSuccess: onDone,
  });

  const isLastStep = step === FACILITY_FORM_STEPS;
  const canGoBack = step > minStep;

  const next = async () => {
    if (!(await form.trigger(STEP_FIELDS[step]))) return;
    setStep((current) => (current + 1) as FacilityFormStep);
  };

  const back = () => {
    if (canGoBack) setStep((current) => (current - 1) as FacilityFormStep);
  };

  const save = form.handleSubmit((values) =>
    submit(values, {
      onError: (submitError) => {
        // Duplicate EIN: go back to the step that owns the field.
        if (isEinConflict(submitError)) {
          form.setError('ein', { message: EIN_EXISTS_MESSAGE });
          setStep(1);
        }
      },
    }),
  );

  // Enter inside an input submits the form: on steps 1-2 it means "Next".
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    return isLastStep ? save() : next();
  };

  return {
    mode,
    form,
    step,
    isLastStep,
    canGoBack,
    next,
    back,
    onSubmit,
    isPending,
    /** Message for failures other than a duplicate EIN. */
    serverError:
      error && !isEinConflict(error) ? GENERIC_ERROR_MESSAGE : undefined,
  };
}
