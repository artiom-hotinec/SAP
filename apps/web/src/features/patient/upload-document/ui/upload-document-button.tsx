'use client';

import { useRef } from 'react';
import { UiButton } from '@/shared/ui/ui-button';
import { useUploadDocument } from '../model/use-upload-document';
import { DOCUMENT_ACCEPT } from '../model/validate-document';

export interface UploadDocumentButtonProps {
  patientId: string;
}

/** "Upload document" button with a hidden file input and error display. */
export function UploadDocumentButton({ patientId }: UploadDocumentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { error, isPending, upload } = useUploadDocument(patientId);

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={DOCUMENT_ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) upload(file);
        }}
      />
      <UiButton
        variant="link"
        disabled={isPending}
        aria-busy={isPending || undefined}
        onClick={() => inputRef.current?.click()}
      >
        {isPending ? 'Uploading…' : 'Upload document'}
      </UiButton>
      {error && (
        <p role="alert" className="text-body-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
