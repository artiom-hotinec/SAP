import type { ReactNode } from 'react';
import type { PatientDocumentDto } from '@/shared/api';
import { formatDate } from '@/shared/lib';
import { getPatientDocumentUrl } from '../api/documents';

export interface DocumentListProps {
  patientId: string;
  documents: PatientDocumentDto[] | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry?: () => void;
  /** Per-row actions (e.g. delete button). */
  renderActions?: (document: PatientDocumentDto) => ReactNode;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Documents list with loading, error and empty states (newest first). */
export function DocumentList({
  patientId,
  documents,
  isPending,
  isError,
  onRetry,
  renderActions,
}: DocumentListProps) {
  if (isPending) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading documents"
        className="flex flex-col gap-3"
      >
        <div className="h-12 animate-pulse rounded-lg bg-grey-200" />
        <div className="h-12 animate-pulse rounded-lg bg-grey-200" />
      </div>
    );
  }
  if (isError) {
    return (
      <p role="alert" className="text-body-md text-grey-700">
        Failed to load documents.
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
  if (!documents || documents.length === 0) {
    return <p className="text-body-md text-grey-700">No documents yet.</p>;
  }
  const sorted = [...documents].sort((a, b) =>
    b.uploadedAt.localeCompare(a.uploadedAt),
  );
  return (
    <ul className="flex flex-col divide-y divide-grey-500">
      {sorted.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <a
              href={getPatientDocumentUrl(patientId, d.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-md break-all text-blue-200 underline"
            >
              {d.name}
            </a>
            <p className="text-body-sm text-grey-700">
              {formatSize(d.size)} · {formatDate(d.uploadedAt)}
            </p>
          </div>
          {renderActions?.(d)}
        </li>
      ))}
    </ul>
  );
}
