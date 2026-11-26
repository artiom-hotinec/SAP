'use client';

import { useState } from 'react';
import { UiAddButton } from '@/shared/ui/ui-add-button';
import { PatientFormModal } from './patient-form-modal';

export interface CreatePatientButtonProps {
  className?: string;
}

export function CreatePatientButton({ className }: CreatePatientButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <UiAddButton
        aria-label="Add patient"
        aria-haspopup="dialog"
        className={className}
        onClick={() => setOpen(true)}
      />
      {open && <PatientFormModal open onClose={() => setOpen(false)} />}
    </>
  );
}
