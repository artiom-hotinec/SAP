import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient, UseMutationOptions } from '@tanstack/react-query';
import {
  patientControllerAddPhoto,
  patientControllerDeletePhoto,
} from '@/shared/api';
import type { ErrorType, PatientDto } from '@/shared/api';

/**
 * Cache-busting key per patient. `PatientDto` has no photo timestamp, so the
 * client keeps a version that is bumped after every upload or delete; the photo
 * URL changes with it and the browser refetches the image.
 */
export const patientPhotoVersionQueryKey = (id: string) =>
  ['patient-photo-version', id] as const;

export function getPatientPhotoUrl(id: string, version = 0) {
  return `/api/patients/${id}/photo?v=${version}`;
}

/** Current photo version of a patient (0 until the photo changes in this session). */
export function usePatientPhotoVersion(id: string) {
  const { data } = useQuery({
    queryKey: patientPhotoVersionQueryKey(id),
    queryFn: () => 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data ?? 0;
}

function bumpPhotoVersion(queryClient: QueryClient, id: string) {
  queryClient.setQueryData(patientPhotoVersionQueryKey(id), Date.now());
}

type PhotoMutationOptions<TVariables> = Omit<
  UseMutationOptions<PatientDto, ErrorType<unknown>, TVariables>,
  'mutationFn'
>;

export interface UploadPatientPhotoVariables {
  id: string;
  file: File;
}

/** `PUT /patients/:id/photo` (multipart); also replaces an existing photo. */
export function useUploadPatientPhotoMutation(
  options?: PhotoMutationOptions<UploadPatientPhotoVariables>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, file }: UploadPatientPhotoVariables) =>
      patientControllerAddPhoto(id, { file }),
    onSuccess: (data, variables, onMutateResult, context) => {
      bumpPhotoVersion(queryClient, variables.id);
      return options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

/** `DELETE /patients/:id/photo`; variable is the patient id. */
export function useDeletePatientPhotoMutation(
  options?: PhotoMutationOptions<string>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id: string) => patientControllerDeletePhoto(id),
    onSuccess: (data, id, onMutateResult, context) => {
      bumpPhotoVersion(queryClient, id);
      return options?.onSuccess?.(data, id, onMutateResult, context);
    },
  });
}
