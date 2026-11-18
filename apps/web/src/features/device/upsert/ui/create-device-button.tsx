'use client';

import { useState } from 'react';
import { UiAddButton } from '@/shared/ui/ui-add-button';
import { DeviceFormDrawer } from './device-form-drawer';

export interface CreateDeviceButtonProps {
  className?: string;
}

export function CreateDeviceButton({ className }: CreateDeviceButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <UiAddButton
        aria-label="Add device"
        aria-haspopup="dialog"
        className={className}
        onClick={() => setOpen(true)}
      />
      {open && <DeviceFormDrawer open onClose={() => setOpen(false)} />}
    </>
  );
}
