'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { PATIENT_FORM_STEPS, STEP_FIELDS } from '../config/steps';
import type { PatientFormStep } from '../config/steps';
import { EMPTY_PATIENT_VALUES } from './form-values';
import type { PatientFormValues } from './form-values';

/**
 * State of the 5-step patient form. Next validates only the current step's
 * fields; Back keeps everything typed, because one form instance holds all steps.
 */
export function usePatientForm() {
  // `onChange`: an error set by `trigger()` on Next clears once the field is valid.
  const form = useForm<PatientFormValues>({
    mode: 'onChange',
    defaultValues: EMPTY_PATIENT_VALUES,
    // Keep values of fields whose step is unmounted (Back/Next).
    shouldUnregister: false,
  });
  const [step, setStep] = useState<PatientFormStep>(1);

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

  // Enter inside an input submits the form: before the last step it means "Next".
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    return next();
  };

  return { form, step, isLastStep, canGoBack, next, back, onSubmit };
}
