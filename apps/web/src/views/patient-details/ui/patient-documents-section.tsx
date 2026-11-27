'use client';

import {
  DocumentList,
  usePatientDocumentsQuery,
} from '@/entities/patient-document';
import { DeleteDocumentButton } from '@/features/patient/delete-document';
import { UploadDocumentButton } from '@/features/patient/upload-document';

export function PatientDocumentsSection({ patientId }: { patientId: string }) {
  const { data, isPending, isError, refetch } =
    usePatientDocumentsQuery(patientId);
  return (
    <section
      aria-label="Documents"
      className="flex flex-col gap-4 rounded-lg border border-grey-500 bg-white p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-body-lg font-medium text-grey-800">Documents</h2>
        <UploadDocumentButton patientId={patientId} />
      </div>
      <DocumentList
        patientId={patientId}
        documents={data}
        isPending={isPending}
        isError={isError}
        onRetry={() => void refetch()}
        renderActions={(d) => (
          <DeleteDocumentButton patientId={patientId} document={d} />
        )}
      />
    </section>
  );
}
