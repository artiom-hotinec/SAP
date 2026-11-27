'use client';

import { NoteList, usePatientNotesQuery } from '@/entities/patient-note';
import { NoteComposer } from '@/features/patient/add-note';

export function PatientNotesSection({ patientId }: { patientId: string }) {
  const { data, isPending, isError, refetch } = usePatientNotesQuery(patientId);
  return (
    <section
      aria-label="Notes"
      className="flex flex-col gap-4 rounded-lg border border-grey-500 bg-white p-6"
    >
      <h2 className="text-body-lg font-medium text-grey-800">Notes</h2>
      <NoteList
        notes={data}
        isPending={isPending}
        isError={isError}
        onRetry={() => void refetch()}
      />
      <NoteComposer patientId={patientId} />
    </section>
  );
}
