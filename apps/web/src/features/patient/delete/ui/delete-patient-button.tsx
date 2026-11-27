'use client';

import clsx from 'clsx';
import { useState } from 'react';
import type { PatientDto } from '@/shared/api';
import { UiIconButton } from '@/shared/ui/ui-icon-button';
import { UiModal } from '@/shared/ui/ui-modal';
import { useDeletePatient } from '../model/use-delete-patient';

export interface DeletePatientButtonProps {
  patient: Pick<PatientDto, 'id' | 'firstName' | 'lastName'>;
  className?: string;
}

export function DeletePatientButton({
  patient,
  className,
}: DeletePatientButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const { mutate, isPending, isError } = useDeletePatient();
  const name = `${patient.firstName} ${patient.lastName}`;

  const handleConfirm = () => {
    setConfirming(false);
    mutate(patient.id);
  };

  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      {isError && (
        <span role="alert" className="text-body-sm text-red-400">
          Couldn’t delete
        </span>
      )}
      <UiIconButton
        icon="/icons/trash.svg"
        aria-label={`Delete patient ${name}`}
        aria-haspopup="dialog"
        disabled={isPending}
        aria-busy={isPending || undefined}
        onClick={() => setConfirming(true)}
      />
      <UiModal
        open={confirming}
        title={`Delete ${name}?`}
        onConfirm={handleConfirm}
        onClose={() => setConfirming(false)}
      />
    </span>
  );
}
