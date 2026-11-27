'use client';

import { useState } from 'react';
import { useUploadDocumentMutation } from '@/entities/patient-document';
import {
  getDocumentErrorMessage,
  validateDocumentFile,
} from './validate-document';

/** Validates a file client-side, then uploads it; the entity refetches the list on success. */
export function useUploadDocument(patientId: string) {
  const [error, setError] = useState<string | null>(null);
  const mutation = useUploadDocumentMutation({
    onSuccess: () => setError(null),
    onError: (e) => setError(getDocumentErrorMessage(e)),
  });

  return {
    error,
    isPending: mutation.isPending,
    upload: (file: File) => {
      const message = validateDocumentFile(file);
      setError(message);
      if (message) return;
      mutation.mutate({ patientId, file });
    },
  };
}
