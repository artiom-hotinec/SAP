import clsx from 'clsx';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import type { PatientDto } from '@/shared/api';
import { patientDetailsRoute } from '@/shared/config';
import { PATIENT_ROW_GRID } from '../config/row-grid';
import { PatientAvatar } from './patient-avatar';

export interface PatientRowProps extends Omit<
  ComponentProps<typeof Link>,
  'href' | 'children'
> {
  patient: PatientDto;
}

/** List row; the whole row links to the patient's details page. */
export function PatientRow({ patient, className, ...props }: PatientRowProps) {
  return (
    <Link
      href={patientDetailsRoute(patient.id)}
      className={clsx(
        PATIENT_ROW_GRID,
        'h-16 rounded-lg border border-grey-500 bg-white text-body-md leading-5.5 text-grey-700 transition-colors hover:bg-grey-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200',
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-4 pr-4">
        <PatientAvatar patient={patient} size="sm" />
        <span className="truncate">
          {patient.firstName} {patient.lastName}
        </span>
      </span>
      <span className="truncate pr-4">{patient.email}</span>
      <span className="truncate pr-4">{patient.phone}</span>
      <span className="truncate">{patient.providerName}</span>
    </Link>
  );
}
