'use client';

import { useDeleteDocumentMutation } from '@/entities/patient-document';

/** Deletes a document; the entity refetches the list on success. */
export function useDeleteDocument() {
  return useDeleteDocumentMutation();
}
