import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import {
  patientNoteControllerCreateNote,
  patientNoteControllerGetNotes,
} from '@/shared/api';
import type { ErrorType, PatientNoteDto } from '@/shared/api';

/** Backend limit for `CreatePatientNoteDto.body`. */
export const MAX_NOTE_LENGTH = 5000;

export const patientNotesQueryKey = (patientId: string) =>
  ['patient-notes', patientId] as const;

/** `GET /patients/:patientId/notes`. */
export function usePatientNotesQuery(patientId: string) {
  return useQuery<PatientNoteDto[], ErrorType<unknown>>({
    queryKey: patientNotesQueryKey(patientId),
    queryFn: ({ signal }) =>
      patientNoteControllerGetNotes(patientId, { signal }),
  });
}

export interface AddNoteVariables {
  patientId: string;
  body: string;
}

/** `POST /patients/:patientId/notes`; refetches the notes list on success. */
export function useAddNoteMutation(
  options?: Omit<
    UseMutationOptions<PatientNoteDto, ErrorType<unknown>, AddNoteVariables>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ patientId, body }: AddNoteVariables) =>
      patientNoteControllerCreateNote(patientId, { body }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: patientNotesQueryKey(variables.patientId),
      });
      return options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
