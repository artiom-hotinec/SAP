'use client';

import { useState } from 'react';
import { UiAddButton } from '@/shared/ui/ui-add-button';
import { FacilityFormDrawer } from './facility-form-drawer';

export interface CreateFacilityButtonProps {
  className?: string;
}

export function CreateFacilityButton({ className }: CreateFacilityButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <UiAddButton
        aria-label="Add facility"
        aria-haspopup="dialog"
        className={className}
        onClick={() => setOpen(true)}
      />
      {open && <FacilityFormDrawer open onClose={() => setOpen(false)} />}
    </>
  );
}
