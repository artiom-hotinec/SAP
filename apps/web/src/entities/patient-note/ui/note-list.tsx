import type { PatientNoteDto } from '@/shared/api';
import { formatDateTime } from '@/shared/lib';

export interface NoteListProps {
  notes: PatientNoteDto[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry?: () => void;
}

/** Notes list with loading, error and empty states (newest first). */
export function NoteList({
  notes,
  isPending,
  isError,
  onRetry,
}: NoteListProps) {
  if (isPending) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading notes"
        className="flex flex-col gap-3"
      >
        <div className="h-16 animate-pulse rounded-lg bg-grey-200" />
        <div className="h-16 animate-pulse rounded-lg bg-grey-200" />
      </div>
    );
  }
  if (isError) {
    return (
      <p role="alert" className="text-body-md text-grey-700">
        Failed to load notes.
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
  if (!notes || notes.length === 0) {
    return <p className="text-body-md text-grey-700">No notes yet.</p>;
  }
  const sorted = [...notes].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return (
    <ul className="flex max-h-96 flex-col gap-3 overflow-y-auto">
      {sorted.map((n) => (
        <li key={n.id} className="rounded-lg bg-grey-200 px-4 py-3">
          <p className="text-body-md wrap-break-word whitespace-pre-wrap text-grey-800">
            {n.body}
          </p>
          <p className="mt-1 text-body-sm text-grey-700">
            {n.authorName} · {formatDateTime(n.createdAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}
