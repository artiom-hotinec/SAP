'use client';

import clsx from 'clsx';
import { useState } from 'react';
import type { DeviceDto } from '@/shared/api';
import { UiIconButton } from '@/shared/ui/ui-icon-button';
import { UiModal } from '@/shared/ui/ui-modal';
import { useDeleteDevice } from '../model/use-delete-device';

export interface DeleteDeviceButtonProps {
  device: Pick<DeviceDto, 'id' | 'deviceId'>;
  className?: string;
}

export function DeleteDeviceButton({
  device,
  className,
}: DeleteDeviceButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const { mutate, isPending, isError } = useDeleteDevice();

  const handleConfirm = () => {
    setConfirming(false);
    mutate(device.id);
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
        aria-label={`Delete device ${device.deviceId}`}
        aria-haspopup="dialog"
        disabled={isPending}
        aria-busy={isPending || undefined}
        onClick={() => setConfirming(true)}
      />
      <UiModal
        open={confirming}
        title={`Delete device ${device.deviceId}?`}
        onConfirm={handleConfirm}
        onClose={() => setConfirming(false)}
      />
    </span>
  );
}
