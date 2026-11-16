'use client';

import { useState } from 'react';
import type { Facility } from '@/shared/api';
import { UiIconButton } from '@/shared/ui/ui-icon-button';
import { FacilityFormDrawer } from './facility-form-drawer';

export interface EditFacilityButtonProps {
  facility: Facility;
  className?: string;
}

export function EditFacilityButton({
  facility,
  className,
}: EditFacilityButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <UiIconButton
        icon="/icons/edit.svg"
        aria-label={`Edit ${facility.name}`}
        aria-haspopup="dialog"
        className={className}
        onClick={() => setOpen(true)}
      />
      {open && (
        <FacilityFormDrawer
          open
          facility={facility}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
