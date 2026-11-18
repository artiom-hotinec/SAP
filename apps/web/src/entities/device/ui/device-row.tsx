'use client';

import clsx from 'clsx';
import { useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import type { DeviceDto } from '@/shared/api';
import { formatDateUtc } from '@/shared/lib';
import { UiIconButton } from '@/shared/ui/ui-icon-button';
import { DEVICE_ROW_GRID } from '../config/row-grid';

export interface DeviceRowProps extends HTMLAttributes<HTMLDivElement> {
  device: DeviceDto;
  expanded?: boolean;
  onToggle?: () => void;
  /** Rendered under the summary while expanded (e.g. `DeviceDetails`). */
  details?: ReactNode;
}

export function DeviceRow({
  device,
  expanded = false,
  onToggle,
  details,
  className,
  ...props
}: DeviceRowProps) {
  const detailsId = useId();

  return (
    <div
      className={clsx(
        'rounded-lg border border-grey-500 bg-white text-body-md leading-5.5 text-grey-700',
        className,
      )}
      {...props}
    >
      <div className={clsx(DEVICE_ROW_GRID, 'h-16')}>
        <span className="truncate pr-4">{device.modelName}</span>
        <span className="truncate pr-4">{device.deviceId}</span>
        <span className="truncate pr-4">
          {formatDateUtc(device.manufactureDate)}
        </span>
        <span className="truncate pr-4">{device.facilityName ?? '--'}</span>
        <UiIconButton
          icon="/icons/chevron-down.svg"
          aria-label={`${expanded ? 'Hide' : 'Show'} details for device ${device.deviceId}`}
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggle}
          iconClassName={clsx(expanded && 'rotate-180')}
        />
      </div>
      <div id={detailsId} hidden={!expanded}>
        {expanded && details}
      </div>
    </div>
  );
}
