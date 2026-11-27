import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { patientControllerCreatePatient } from '@/shared/api';
import type { CreatePatientDto, ErrorType, PatientDto } from '@/shared/api';

type MutationOptions<TVariables> = Omit<
  UseMutationOptions<PatientDto, ErrorType<unknown>, TVariables>,
  'mutationFn'
>;

export function useCreatePatientMutation(
  options?: MutationOptions<CreatePatientDto>,
) {
  return useMutation({
    ...options,
    mutationFn: (data: CreatePatientDto) =>
      patientControllerCreatePatient(data),
  });
}
