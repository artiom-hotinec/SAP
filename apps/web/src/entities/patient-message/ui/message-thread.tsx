import clsx from 'clsx';
import type { PatientMessageDto } from '@/shared/api';
import { PatientMessageDtoDirection } from '@/shared/api';
import { formatDateTime } from '@/shared/lib';

export interface MessageThreadProps {
  messages: PatientMessageDto[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry?: () => void;
}

/** Message thread with loading, error and empty states (oldest first). */
export function MessageThread({
  messages,
  isPending,
  isError,
  onRetry,
}: MessageThreadProps) {
  if (isPending) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading messages"
        className="flex flex-col gap-3"
      >
        <div className="h-14 w-2/3 animate-pulse rounded-lg bg-grey-200" />
        <div className="ml-auto h-14 w-2/3 animate-pulse rounded-lg bg-grey-200" />
      </div>
    );
  }
  if (isError) {
    return (
      <p role="alert" className="text-body-md text-grey-700">
        Failed to load messages.
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-2 text-blue-200 underline"
          >
            Retry
          </button>
        )}
      </p>
    );
  }
  if (!messages || messages.length === 0) {
    return <p className="text-body-md text-grey-700">No messages yet.</p>;
  }
  const sorted = [...messages].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  return (
    <ul className="flex max-h-96 flex-col gap-3 overflow-y-auto">
      {sorted.map((m) => {
        const fromProvider =
          m.direction === PatientMessageDtoDirection.PROVIDER_TO_PATIENT;
        return (
          <li
            key={m.id}
            className={clsx(
              'max-w-[75%] rounded-lg px-4 py-3',
              fromProvider
                ? 'ml-auto bg-blue-50 text-white'
                : 'bg-grey-200 text-grey-800',
            )}
          >
            <p className="text-body-md wrap-break-word whitespace-pre-wrap">
              {m.body}
            </p>
            <p className="mt-1 text-body-sm opacity-70">
              {fromProvider ? m.providerName : 'Patient'} ·{' '}
              {formatDateTime(m.createdAt)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
