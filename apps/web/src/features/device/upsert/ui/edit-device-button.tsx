'use client';

import { useState } from 'react';
import type { DeviceDto } from '@/shared/api';
import { UiIconButton } from '@/shared/ui/ui-icon-button';
import { DeviceFormDrawer } from './device-form-drawer';

export interface EditDeviceButtonProps {
  device: DeviceDto;
  className?: string;
}

export function EditDeviceButton({ device, className }: EditDeviceButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <UiIconButton
        icon="/icons/edit.svg"
        aria-label={`Edit device ${device.deviceId}`}
        aria-haspopup="dialog"
        className={className}
        onClick={() => setOpen(true)}
      />
      {open && (
        <DeviceFormDrawer open device={device} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
