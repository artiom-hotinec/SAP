'use client';

import {
  MessageThread,
  usePatientMessagesQuery,
} from '@/entities/patient-message';
import { MessageComposer } from '@/features/patient/send-message';

export function PatientMessagesSection({ patientId }: { patientId: string }) {
  const { data, isPending, isError, refetch } =
    usePatientMessagesQuery(patientId);
  return (
    <section
      aria-label="Messages"
      className="flex flex-col gap-4 rounded-lg border border-grey-500 bg-white p-6"
    >
      <h2 className="text-body-lg font-medium text-grey-800">Messages</h2>
      <MessageThread
        messages={data}
        isPending={isPending}
        isError={isError}
        onRetry={() => void refetch()}
      />
      <MessageComposer patientId={patientId} />
    </section>
  );
}
