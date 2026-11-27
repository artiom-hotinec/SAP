'use client';

import Image from 'next/image';
import {
  PatientClinicalInfo,
  PatientDevice,
  PatientProfile,
  usePatientQuery,
} from '@/entities/patient';
import { DeletePatientButton } from '@/features/patient/delete';
import { PatientPhotoControl } from '@/features/patient/photo';
import { EditPatientButton } from '@/features/patient/upsert';
import { ROUTES } from '@/shared/config';
import { UiLink } from '@/shared/ui/ui-link';
import { UiPageTitle } from '@/shared/ui/ui-page-title';

import { PatientDocumentsSection } from './patient-documents-section';
import { PatientMessagesSection } from './patient-messages-section';
import { PatientNotesSection } from './patient-notes-section';

export interface PatientDetailsPageProps {
  id: string;
}

export function PatientDetailsPage({ id }: PatientDetailsPageProps) {
  const { data, isPending, isError, error } = usePatientQuery(id);

  return (
    <div className="-mt-5.5 w-full max-w-266.75">
      <UiLink
        href={ROUTES.patients}
        className="mb-5.25 inline-flex items-center gap-2 text-blue-50!"
      >
        <Image src="/icons/arrow-left.svg" alt="" width={24} height={24} />
        Back to all patients
      </UiLink>

      {isError ? (
        <p role="alert" className="text-body-md text-grey-700">
          {error.response?.status === 404
            ? 'Patient not found.'
            : 'Failed to load patient.'}
        </p>
      ) : isPending ? (
        <PatientDetailsSkeleton />
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between gap-4">
            <UiPageTitle className="text-grey-800">
              {data.firstName} {data.lastName}
            </UiPageTitle>
            <div className="flex items-center gap-2">
              <EditPatientButton patient={data} />
              <DeletePatientButton patient={data} />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <PatientProfile
              patient={data}
              avatarActions={
                <PatientPhotoControl key={data.id} patientId={data.id} />
              }
            />
            <PatientClinicalInfo patient={data} />
            <PatientDevice />
            <PatientDocumentsSection patientId={data.id} />
            <PatientMessagesSection patientId={data.id} />
            <PatientNotesSection patientId={data.id} />
          </div>
        </>
      )}
    </div>
  );
}

function PatientDetailsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading patient">
      <div className="mb-6 h-12 w-72 animate-pulse rounded-lg bg-grey-200" />
      <div className="flex flex-col gap-6">
        <div className="h-100 animate-pulse rounded-lg border border-grey-500 bg-grey-200" />
        <div className="h-40 animate-pulse rounded-lg border border-grey-500 bg-grey-200" />
        <div className="h-32 animate-pulse rounded-lg border border-grey-500 bg-grey-200" />
      </div>
    </div>
  );
}
