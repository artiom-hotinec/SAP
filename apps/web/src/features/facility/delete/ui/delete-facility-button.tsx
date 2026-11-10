'use client';

import clsx from 'clsx';
import { useState } from 'react';
import type { Facility } from '@/shared/api';
import { UiIconButton } from '@/shared/ui/ui-icon-button';
import { UiModal } from '@/shared/ui/ui-modal';
import { useDeleteFacility } from '../model/use-delete-facility';

export interface DeleteFacilityButtonProps {
  facility: Pick<Facility, 'id' | 'name'>;
  className?: string;
}

export function DeleteFacilityButton({
  facility,
  className,
}: DeleteFacilityButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const { mutate, isPending, isError } = useDeleteFacility();

  const handleConfirm = () => {
    setConfirming(false);
    mutate(facility.id);
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
        aria-label={`Delete ${facility.name}`}
        aria-haspopup="dialog"
        disabled={isPending}
        aria-busy={isPending || undefined}
        onClick={() => setConfirming(true)}
      />
      <UiModal
        open={confirming}
        title={`Delete ${facility.name}?`}
        onConfirm={handleConfirm}
        onClose={() => setConfirming(false)}
      />
    </span>
  );
}
