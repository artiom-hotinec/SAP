import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import type { PatientDto } from '@/shared/api';
import { formatDateUtc } from '@/shared/lib';
import { UiReadonlyField } from '@/shared/ui/ui-readonly-field';

export interface PatientClinicalInfoProps extends HTMLAttributes<HTMLElement> {
  patient: PatientDto;
}

/**
 * Provider and last appointment. `PatientDto` has no mask fitting / sleep study
 * data, so only what it provides is shown.
 */
export function PatientClinicalInfo({
  patient,
  className,
  ...props
}: PatientClinicalInfoProps) {
  return (
    <section
      aria-label="Clinical info"
      className={clsx(
        'flex gap-20.75 rounded-lg border border-grey-500 bg-white px-6 py-6',
        className,
      )}
      {...props}
    >
      <UiReadonlyField
        label="Patient's Provider"
        value={patient.providerName || '--'}
        className="w-55"
      />
      <UiReadonlyField
        label="Last Appointment"
        value={
          patient.lastAppointment
            ? formatDateUtc(patient.lastAppointment)
            : '--'
        }
        className="w-55"
      />
    </section>
  );
}
