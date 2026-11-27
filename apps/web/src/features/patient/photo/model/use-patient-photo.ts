'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  patientsQueryKey,
  useDeletePatientPhotoMutation,
  useUploadPatientPhotoMutation,
} from '@/entities/patient';
import { getPhotoErrorMessage, validatePhotoFile } from './validate-photo';

/** Upload/replace/remove state for one patient's photo; refreshes the patient queries after a change. */
export function usePatientPhoto(id: string) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    setError(null);
    return queryClient.invalidateQueries({ queryKey: patientsQueryKey });
  };
  const fail = (e: unknown) => setError(getPhotoErrorMessage(e));

  const upload = useUploadPatientPhotoMutation({
    onSuccess: refresh,
    onError: fail,
  });
  const remove = useDeletePatientPhotoMutation({
    onSuccess: refresh,
    onError: fail,
  });

  return {
    error,
    isPending: upload.isPending || remove.isPending,
    upload: (file: File) => {
      const message = validatePhotoFile(file);
      if (message) {
        setError(message);
        return;
      }
      setError(null);
      upload.mutate({ id, file });
    },
    remove: () => {
      setError(null);
      remove.mutate(id);
    },
  };
}
