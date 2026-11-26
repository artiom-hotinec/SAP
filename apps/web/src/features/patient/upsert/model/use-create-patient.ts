'use client';

import { useQueryClient } from '@tanstack/react-query';
import { patientsQueryKey, useCreatePatientMutation } from '@/entities/patient';
import { statisticsQueryKey } from '@/entities/statistics';
import type { ErrorType } from '@/shared/api';
import { toCreateDto } from './form-values';
import type { PatientFormValues } from './form-values';

export interface SubmitCallbacks {
  onError?: (error: ErrorType<unknown>) => void;
}

/** Creates the patient, then refreshes the list and the dashboard counters. */
export function useCreatePatient({ onSuccess }: { onSuccess?: () => void }) {
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

  const submit = (values: PatientFormValues, callbacks?: SubmitCallbacks) =>
    create.mutate(toCreateDto(values), callbacks);

  return { submit, isPending: create.isPending, error: create.error };
}
