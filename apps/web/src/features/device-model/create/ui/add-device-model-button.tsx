'use client';

import { useState } from 'react';
import { UiButton } from '@/shared/ui/ui-button';
import { DeviceModelFormDrawer } from './device-model-form-drawer';

export interface AddDeviceModelButtonProps {
  className?: string;
}

/** The "Add New Model" text link above the device list. */
export function AddDeviceModelButton({ className }: AddDeviceModelButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <UiButton
        variant="link"
        aria-haspopup="dialog"
        className={className ?? 'text-body-md'}
        onClick={() => setOpen(true)}
      >
        Add New Model
      </UiButton>
      {open && <DeviceModelFormDrawer open onClose={() => setOpen(false)} />}
    </>
  );
}
