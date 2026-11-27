'use client';

import { useState } from 'react';
import type { PatientDto } from '@/shared/api';
import { UiIconButton } from '@/shared/ui/ui-icon-button';
import { PatientFormModal } from './patient-form-modal';

export interface EditPatientButtonProps {
  patient: PatientDto;
  className?: string;
}

export function EditPatientButton({
  patient,
  className,
}: EditPatientButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <UiIconButton
        icon="/icons/edit.svg"
        aria-label={`Edit ${patient.firstName} ${patient.lastName}`}
        aria-haspopup="dialog"
        className={className}
        onClick={() => setOpen(true)}
      />
      {open && (
        <PatientFormModal
          open
          patient={patient}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
