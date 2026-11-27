'use client';

import { useState } from 'react';
import { useSendMessageMutation } from '@/entities/patient-message';
import {
  getSendMessageErrorMessage,
  validateMessageBody,
} from './validate-message';

/** Composer state for one patient's thread: draft, validation and send; the thread refetches on success. */
export function useSendMessage(patientId: string) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useSendMessageMutation({
    onSuccess: () => {
      setBody('');
      setError(null);
    },
    onError: (e) => setError(getSendMessageErrorMessage(e)),
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
      const message = validateMessageBody(body);
      if (message) {
        setError(message);
        return;
      }
      setError(null);
      mutation.mutate({ patientId, body: body.trim() });
    },
  };
}
