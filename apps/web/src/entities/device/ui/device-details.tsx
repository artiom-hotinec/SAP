import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import type { DeviceDto } from '@/shared/api';
import { formatDateTime, formatDateUtc } from '@/shared/lib';
import { UiReadonlyField } from '@/shared/ui/ui-readonly-field';

export interface DeviceDetailsProps extends HTMLAttributes<HTMLElement> {
  device: DeviceDto;
  /** Controls shown next to the title (e.g. edit / delete buttons). */
  actions?: ReactNode;
}

export function DeviceDetails({
  device,
  actions,
  className,
  ...props
}: DeviceDetailsProps) {
  const titleId = `device-details-${device.id}`;

  return (
    <section
      aria-labelledby={titleId}
      className={clsx('border-t border-grey-500 px-6 pt-4.5 pb-6', className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-6">
        <h2 id={titleId} className="text-body-md font-bold text-grey-700">
          Device Information
        </h2>
        {actions && <div className="flex items-center gap-6">{actions}</div>}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5.75 lg:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-25.5">
        <UiReadonlyField label="Model" value={device.modelName} />
        <UiReadonlyField
          className="col-span-2 lg:col-span-2 lg:max-w-122"
          label="Device ID"
          value={device.deviceId}
        />

        <UiReadonlyField
          label="Date of Manufacture"
          value={formatDateUtc(device.manufactureDate)}
        />
        <UiReadonlyField label="Facility" value={device.facilityName ?? '--'} />
        <UiReadonlyField
          label="Last Connected On"
          value={
            device.lastConnectedAt
              ? formatDateTime(device.lastConnectedAt)
              : '--'
          }
        />
      </div>
    </section>
  );
}
