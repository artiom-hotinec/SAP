'use client';

import { useId } from 'react';
import type { Facility } from '@/shared/api';
import { UiButton } from '@/shared/ui/ui-button';
import { UiDrawer } from '@/shared/ui/ui-drawer';
import { UiStepper } from '@/shared/ui/ui-stepper';
import { FACILITY_FORM_STEPS } from '../config/steps';
import { useFacilityForm } from '../model/use-facility-form';
import { AddressStep } from './steps/address-step';
import { ContactStep } from './steps/contact-step';
import { IdentifiersStep } from './steps/identifiers-step';

export interface FacilityFormDrawerProps {
  open: boolean;
  /** Edit this facility; omit to create a new one. */
  facility?: Facility;
  onClose: () => void;
}

/**
 * Mount it only while it is open: the form state lives here, so a fresh mount
 * always starts from the facility's current values (or an empty form).
 */
export function FacilityFormDrawer({
  open,
  facility,
  onClose,
}: FacilityFormDrawerProps) {
  const formId = useId();
  const {
    mode,
    form,
    step,
    isLastStep,
    canGoBack,
    back,
    onSubmit,
    isPending,
    serverError,
  } = useFacilityForm({ facility, onDone: onClose });

  return (
    <UiDrawer
      open={open}
      title={mode === 'edit' ? 'Edit Facility Info' : 'New Facility Info'}
      onClose={onClose}
      stepper={
        <UiStepper
          steps={FACILITY_FORM_STEPS}
          current={step}
          aria-label={`Step ${step} of ${FACILITY_FORM_STEPS}`}
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
        {step === 1 && <IdentifiersStep form={form} />}
        {step === 2 && <AddressStep form={form} />}
        {step === 3 && <ContactStep form={form} />}
      </form>
    </UiDrawer>
  );
}
