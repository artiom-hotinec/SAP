import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import { UiReadonlyField } from '@/shared/ui/ui-readonly-field';

export type PatientDeviceProps = HTMLAttributes<HTMLElement>;

/** Assigned device. `PatientDto` doesn't expose the device yet, so this shows `--`. */
export function PatientDevice({ className, ...props }: PatientDeviceProps) {
  return (
    <section
      aria-label="Assigned device"
      className={clsx(
        'rounded-lg border border-grey-500 bg-white px-6 py-6',
        className,
      )}
      {...props}
    >
      <UiReadonlyField label="Device ID" value="--" className="w-110" />
    </section>
  );
}
