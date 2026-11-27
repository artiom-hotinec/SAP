'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { PATIENT_FORM_STEPS, STEP_FIELDS } from '../config/steps';
import type { PatientFormStep } from '../config/steps';
import type { PatientDto } from '@/shared/api';
import { EMPTY_PATIENT_VALUES, toFormValues } from './form-values';
import type { PatientFormValues } from './form-values';
import { mapPatientError } from './map-patient-error';
import { useSavePatient } from './use-save-patient';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/**
 * State of the 5-step patient form. Next validates only the current step's
 * fields; Back keeps everything typed, because one form instance holds all steps.
 */
export function usePatientForm({
  patient,
  onDone,
}: {
  /** Edit this patient; omitted = create. */
  patient?: PatientDto;
  onDone: () => void;
}) {
  // `onChange`: an error set by `trigger()` on Next clears once the field is valid.
  const form = useForm<PatientFormValues>({
    mode: 'onChange',
    defaultValues: patient ? toFormValues(patient) : EMPTY_PATIENT_VALUES,
    // Keep values of fields whose step is unmounted (Back/Next).
    shouldUnregister: false,
  });
  const [step, setStep] = useState<PatientFormStep>(1);
  const { submit, isPending, error } = useSavePatient({
    patient,
    onSuccess: onDone,
  });

  const isLastStep = step === PATIENT_FORM_STEPS;
  const canGoBack = step > 1;

  const next = async () => {
    if (isLastStep) return;
    if (!(await form.trigger(STEP_FIELDS[step]))) return;
    setStep((current) => (current + 1) as PatientFormStep);
  };

  const back = () => {
    if (canGoBack) setStep((current) => (current - 1) as PatientFormStep);
  };

  const save = form.handleSubmit((values) =>
    submit(values, {
      onError: (submitError) => {
        // Show the error on its field and go to that step.
        const fieldError = mapPatientError(submitError);
        if (fieldError) {
          form.setError(fieldError.field, { message: fieldError.message });
          setStep(fieldError.step);
        }
      },
    }),
  );

  // Enter inside an input submits the form: before the last step it means "Next".
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    return isLastStep ? save() : next();
  };

  return {
    form,
    step,
    isLastStep,
    canGoBack,
    next,
    back,
    onSubmit,
    isPending,
    /** Message for failures that don't belong to a field. */
    serverError:
      error && !mapPatientError(error) ? GENERIC_ERROR_MESSAGE : undefined,
  };
}
