import clsx from 'clsx';
import Image from 'next/image';
import type { HTMLAttributes } from 'react';

export type UiTableHeaderVariant = 'provider' | 'portal-admin' | 'super-admin';

export interface UiTableHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Role the table is shown for; changes the 4th column label. */
  variant?: UiTableHeaderVariant;
}

const THIRD_COLUMN_LABEL: Record<UiTableHeaderVariant, string> = {
  provider: 'Email',
  'portal-admin': 'Provider Name',
  'super-admin': 'Facility Name',
};

export function UiTableHeader({
  variant = 'provider',
  className,
  ...props
}: UiTableHeaderProps) {
  return (
    <div
      role="row"
      className={clsx(
        'grid h-12 w-full grid-cols-[95px_211px_182px_249px_1fr] items-center rounded-lg bg-white px-6 text-body-md font-bold whitespace-nowrap text-grey-700',
        className,
      )}
      {...props}
    >
      <span role="columnheader" className="flex items-center gap-2">
        Active
        <Image
          src="/icons/info.svg"
          alt=""
          width={18}
          height={18}
          className="shrink-0"
        />
      </span>
      <span role="columnheader">Patient Name</span>
      <span role="columnheader">Phone Number</span>
      <span role="columnheader">{THIRD_COLUMN_LABEL[variant]}</span>
      <span role="columnheader">Last Appointment</span>
    </div>
  );
}
