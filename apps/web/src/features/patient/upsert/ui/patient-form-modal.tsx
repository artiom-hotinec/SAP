'use client';

import { useId } from 'react';
import type { PatientDto } from '@/shared/api';
import { UiButton } from '@/shared/ui/ui-button';
import { UiFormModal } from '@/shared/ui/ui-form-modal';
import { UiStepper } from '@/shared/ui/ui-stepper';
import { PATIENT_FORM_STEPS } from '../config/steps';
import { usePatientForm } from '../model/use-patient-form';
import { AddressStep } from './steps/address-step';
import { DeviceStep } from './steps/device-step';
import { PersonalInfoStep } from './steps/personal-info-step';
import { ProviderStep } from './steps/provider-step';
import { SleepStudyStep } from './steps/sleep-study-step';

export interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Edit this patient; omitted = create a new one. */
  patient?: PatientDto;
}

/**
 * Mount it only while it is open: the form state lives here, so each mount
 * starts from an empty form (or the patient's values).
 */
export function PatientFormModal({
  open,
  onClose,
  patient,
}: PatientFormModalProps) {
  const formId = useId();
  const {
    form,
    step,
    isLastStep,
    canGoBack,
    back,
    onSubmit,
    isPending,
    serverError,
  } = usePatientForm({ patient, onDone: onClose });

  return (
    <UiFormModal
      open={open}
      title={patient ? 'Edit Patient' : 'New Patient'}
      onClose={onClose}
      stepper={
        <UiStepper
          steps={PATIENT_FORM_STEPS}
          current={step}
          aria-label={`Step ${step} of ${PATIENT_FORM_STEPS}`}
        />
      }
      footer={
        <>
          {serverError && (
            <p role="alert" className="mb-3 text-body-sm text-red-400">
              {serverError}
            </p>
          )}
          <div className="flex items-center">
            {canGoBack && (
              <UiButton variant="link" className="w-16" onClick={back}>
                Back
              </UiButton>
            )}
            <div className="ml-auto flex items-center gap-10">
              <UiButton variant="cancel" onClick={onClose}>
                Cancel
              </UiButton>
              <UiButton
                type="submit"
                form={formId}
                className="w-32.5"
                disabled={isPending}
              >
                {isLastStep ? 'Save' : 'Next'}
              </UiButton>
            </div>
          </div>
        </>
      }
    >
      <form id={formId} noValidate onSubmit={onSubmit}>
        {step === 1 && <PersonalInfoStep form={form} />}
        {step === 2 && <AddressStep form={form} />}
        {step === 3 && <ProviderStep form={form} />}
        {step === 4 && <SleepStudyStep form={form} />}
        {step === 5 && <DeviceStep form={form} />}
      </form>
    </UiFormModal>
  );
}
