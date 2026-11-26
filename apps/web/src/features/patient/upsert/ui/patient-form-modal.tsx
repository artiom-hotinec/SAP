'use client';

import { useId } from 'react';
import { UiButton } from '@/shared/ui/ui-button';
import { UiFormModal } from '@/shared/ui/ui-form-modal';
import { UiStepper } from '@/shared/ui/ui-stepper';
import { PATIENT_FORM_STEPS } from '../config/steps';
import { usePatientForm } from '../model/use-patient-form';
import { AddressStep } from './steps/address-step';
import { PersonalInfoStep } from './steps/personal-info-step';

export interface PatientFormModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Mount it only while it is open: the form state lives here, so each mount
 * starts from an empty form.
 */
export function PatientFormModal({ open, onClose }: PatientFormModalProps) {
  const formId = useId();
  const { form, step, isLastStep, canGoBack, back, onSubmit } =
    usePatientForm();

  return (
    <UiFormModal
      open={open}
      title="New Patient"
      onClose={onClose}
      stepper={
        <UiStepper
          steps={PATIENT_FORM_STEPS}
          current={step}
          aria-label={`Step ${step} of ${PATIENT_FORM_STEPS}`}
        />
      }
      footer={
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
              disabled={isLastStep}
            >
              {isLastStep ? 'Save' : 'Next'}
            </UiButton>
          </div>
        </div>
      }
    >
      <form id={formId} noValidate onSubmit={onSubmit}>
        {step === 1 && <PersonalInfoStep form={form} />}
        {step === 2 && <AddressStep form={form} />}
      </form>
    </UiFormModal>
  );
}
