import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import {
  patientDocumentControllerDeleteDocument,
  patientDocumentControllerGetDocuments,
  patientDocumentControllerUploadDocument,
} from '@/shared/api';
import type { ErrorType, PatientDocumentDto } from '@/shared/api';

export const patientDocumentsQueryKey = (patientId: string) =>
  ['patient-documents', patientId] as const;

/** `GET /patients/:patientId/documents`. */
export function usePatientDocumentsQuery(patientId: string) {
  return useQuery<PatientDocumentDto[], ErrorType<unknown>>({
    queryKey: patientDocumentsQueryKey(patientId),
    queryFn: ({ signal }) =>
      patientDocumentControllerGetDocuments(patientId, { signal }),
  });
}

/** Same-origin URL of `GET /patients/:patientId/documents/:documentId/file` (open or download). */
export function getPatientDocumentUrl(patientId: string, documentId: string) {
  return `/api/patients/${patientId}/documents/${documentId}/file`;
}

export interface UploadDocumentVariables {
  patientId: string;
  file: File;
}

/** `POST /patients/:patientId/documents` (multipart); refetches the list on success. */
export function useUploadDocumentMutation(
  options?: Omit<
    UseMutationOptions<
      PatientDocumentDto,
      ErrorType<unknown>,
      UploadDocumentVariables
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ patientId, file }: UploadDocumentVariables) =>
      patientDocumentControllerUploadDocument(patientId, { file }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: patientDocumentsQueryKey(variables.patientId),
      });
      return options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export interface DeleteDocumentVariables {
  patientId: string;
  documentId: string;
}

/** `DELETE /patients/:patientId/documents/:documentId`; refetches the list on success. */
export function useDeleteDocumentMutation(
  options?: Omit<
    UseMutationOptions<void, ErrorType<unknown>, DeleteDocumentVariables>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ patientId, documentId }: DeleteDocumentVariables) =>
      patientDocumentControllerDeleteDocument(patientId, documentId),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: patientDocumentsQueryKey(variables.patientId),
      });
      return options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
