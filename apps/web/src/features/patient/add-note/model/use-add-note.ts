'use client';

import { useState } from 'react';
import { useAddNoteMutation } from '@/entities/patient-note';
import { getAddNoteErrorMessage, validateNoteBody } from './validate-note';

/** Note form state for one patient: draft, validation and add; the list refetches on success. */
export function useAddNote(patientId: string) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useAddNoteMutation({
    onSuccess: () => {
      setBody('');
      setError(null);
    },
    onError: (e) => setError(getAddNoteErrorMessage(e)),
  });

  return {
    body,
    error,
    isPending: mutation.isPending,
    onChange: (value: string) => {
      setBody(value);
      setError(null);
    },
    submit: () => {
      if (mutation.isPending) return;
      const message = validateNoteBody(body);
      if (message) {
        setError(message);
        return;
      }
      setError(null);
      mutation.mutate({ patientId, body: body.trim() });
    },
  };
}
