import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import type { PatientDto } from '@/shared/api';
import { formatDateUtc } from '@/shared/lib';
import { UiReadonlyField } from '@/shared/ui/ui-readonly-field';
import { fromHeightIn } from '../lib/validation';
import { PatientAvatar } from './patient-avatar';

const SEX_LABELS = { FEMALE: 'Female', MALE: 'Male', OTHER: 'Other' } as const;

export interface PatientProfileProps extends HTMLAttributes<HTMLElement> {
  patient: PatientDto;
}

/** Profile card: photo (initials fallback) and the read-only personal info and address. */
export function PatientProfile({
  patient,
  className,
  ...props
}: PatientProfileProps) {
  const { feet, inches } = fromHeightIn(patient.heightIn);

  return (
    <section
      aria-label="Patient profile"
      className={clsx(
        'flex gap-18.5 rounded-lg border border-grey-500 bg-white px-6 py-6',
        className,
      )}
      {...props}
    >
      <PatientAvatar key={patient.id} patient={patient} />
      <div className="grid grid-cols-[repeat(2,220px)] gap-x-20.75 gap-y-6.5">
        <UiReadonlyField label="First Name" value={patient.firstName || '--'} />
        <UiReadonlyField label="Last Name" value={patient.lastName || '--'} />
        <UiReadonlyField
          label="Date of Birth"
          value={patient.dob ? formatDateUtc(patient.dob) : '--'}
        />
        <UiReadonlyField
          label="Sex"
          value={patient.sex ? SEX_LABELS[patient.sex] : '--'}
        />
        <UiReadonlyField
          label="Height"
          value={feet ? `${feet} ft ${inches} in` : '--'}
        />
        <UiReadonlyField
          label="Weight"
          value={patient.weightLb != null ? `${patient.weightLb} lbs` : '--'}
        />
        <UiReadonlyField label="Email" value={patient.email || '--'} />
        <UiReadonlyField label="Phone Number" value={patient.phone || '--'} />
        <UiReadonlyField
          label="Address"
          value={patient.address || '--'}
          className="col-span-2"
        />
        <UiReadonlyField label="Apartment/Suite" value={patient.unit || '--'} />
        <UiReadonlyField label="City" value={patient.city || '--'} />
        <UiReadonlyField label="State" value={patient.state || '--'} />
        <UiReadonlyField label="Zip Code" value={patient.zip || '--'} />
      </div>
    </section>
  );
}
