import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import {
  patientControllerCreatePatient,
  patientControllerDeletePatient,
  patientControllerUpdatePatient,
} from '@/shared/api';
import type {
  CreatePatientDto,
  ErrorType,
  PatientDto,
  UpdatePatientDto,
} from '@/shared/api';

type MutationOptions<TVariables> = Omit<
  UseMutationOptions<PatientDto, ErrorType<unknown>, TVariables>,
  'mutationFn'
>;

export interface UpdatePatientVariables {
  id: string;
  data: UpdatePatientDto;
}

export function useCreatePatientMutation(
  options?: MutationOptions<CreatePatientDto>,
) {
  return useMutation({
    ...options,
    mutationFn: (data: CreatePatientDto) =>
      patientControllerCreatePatient(data),
  });
}

export function useUpdatePatientMutation(
  options?: MutationOptions<UpdatePatientVariables>,
) {
  return useMutation({
    ...options,
    mutationFn: ({ id, data }: UpdatePatientVariables) =>
      patientControllerUpdatePatient(id, data),
  });
}

export function useDeletePatientMutation(options?: MutationOptions<string>) {
  return useMutation({
    ...options,
    mutationFn: (id: string) => patientControllerDeletePatient(id),
  });
}
