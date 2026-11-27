'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  patientsQueryKey,
  useCreatePatientMutation,
  useUpdatePatientMutation,
} from '@/entities/patient';
import { statisticsQueryKey } from '@/entities/statistics';
import type { ErrorType, PatientDto } from '@/shared/api';
import { toCreateDto, toFormValues, toUpdateDto } from './form-values';
import type { PatientFormValues } from './form-values';

export interface SubmitCallbacks {
  onError?: (error: ErrorType<unknown>) => void;
}

/**
 * Creates the patient, or updates `patient` when given, then refreshes the
 * queries that show it (the list and dashboard counters on create; the list and
 * the patient page on edit).
 */
export function useSavePatient({
  patient,
  onSuccess,
}: {
  patient?: PatientDto;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const create = useCreatePatientMutation({
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: patientsQueryKey }),
        queryClient.invalidateQueries({ queryKey: statisticsQueryKey }),
      ]);
      onSuccess?.();
    },
  });

  // `patientsQueryKey` is a prefix of the single-patient key, so this refreshes both.
  const update = useUpdatePatientMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: patientsQueryKey });
      onSuccess?.();
    },
  });

  const submit = (values: PatientFormValues, callbacks?: SubmitCallbacks) => {
    if (patient) {
      update.mutate(
        { id: patient.id, data: toUpdateDto(values, toFormValues(patient)) },
        callbacks,
      );
    } else {
      create.mutate(toCreateDto(values), callbacks);
    }
  };

  const active = patient ? update : create;

  return { submit, isPending: active.isPending, error: active.error };
}
