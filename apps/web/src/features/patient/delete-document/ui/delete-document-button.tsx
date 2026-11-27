'use client';

import clsx from 'clsx';
import { useState } from 'react';
import type { PatientDocumentDto } from '@/shared/api';
import { UiIconButton } from '@/shared/ui/ui-icon-button';
import { UiModal } from '@/shared/ui/ui-modal';
import { useDeleteDocument } from '../model/use-delete-document';

export interface DeleteDocumentButtonProps {
  patientId: string;
  document: Pick<PatientDocumentDto, 'id' | 'name'>;
  className?: string;
}

/** Trash button that asks for confirmation before deleting a document. */
export function DeleteDocumentButton({
  patientId,
  document,
  className,
}: DeleteDocumentButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const { mutate, isPending, isError } = useDeleteDocument();

  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      {isError && (
        <span role="alert" className="text-body-sm text-red-400">
          Couldn’t delete
        </span>
      )}
      <UiIconButton
        icon="/icons/trash.svg"
        aria-label={`Delete document ${document.name}`}
        aria-haspopup="dialog"
        disabled={isPending}
        aria-busy={isPending || undefined}
        onClick={() => setConfirming(true)}
      />
      <UiModal
        open={confirming}
        title={`Delete ${document.name}?`}
        onConfirm={() => {
          setConfirming(false);
          mutate({ patientId, documentId: document.id });
        }}
        onClose={() => setConfirming(false)}
      />
    </span>
  );
}
