import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import {
  patientMessageControllerGetMessages,
  patientMessageControllerSendMessage,
} from '@/shared/api';
import type { ErrorType, PatientMessageDto } from '@/shared/api';

/** Maximum message length accepted by the API (`CreatePatientMessageDto.body`). */
export const MAX_MESSAGE_LENGTH = 2000;

export const patientMessagesQueryKey = (patientId: string) =>
  ['patient-messages', patientId] as const;

/** `GET /patients/:patientId/messages`. */
export function usePatientMessagesQuery(patientId: string) {
  return useQuery<PatientMessageDto[], ErrorType<unknown>>({
    queryKey: patientMessagesQueryKey(patientId),
    queryFn: ({ signal }) =>
      patientMessageControllerGetMessages(patientId, { signal }),
  });
}

export interface SendMessageVariables {
  patientId: string;
  body: string;
}

/** `POST /patients/:patientId/messages`; refetches the thread on success. */
export function useSendMessageMutation(
  options?: Omit<
    UseMutationOptions<
      PatientMessageDto,
      ErrorType<unknown>,
      SendMessageVariables
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ patientId, body }: SendMessageVariables) =>
      patientMessageControllerSendMessage(patientId, { body }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({
        queryKey: patientMessagesQueryKey(variables.patientId),
      });
      return options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
