'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  facilitiesQueryKey,
  useCreateFacilityMutation,
  useUpdateFacilityMutation,
} from '@/entities/facility';
import { statisticsQueryKey } from '@/entities/statistics';
import type { ErrorType } from '@/shared/api';
import { toCreateDto, toUpdateDto } from './form-values';
import type { FacilityFormValues } from './form-values';

export interface UseUpsertFacilityOptions {
  /** Set to update that facility; omit to create a new one. */
  facilityId?: string;
  /** Called after the cache is refreshed. */
  onSuccess?: () => void;
}

export interface SubmitCallbacks {
  onError?: (error: ErrorType<unknown>) => void;
}

export function useUpsertFacility({
  facilityId,
  onSuccess,
}: UseUpsertFacilityOptions) {
  const queryClient = useQueryClient();

  const create = useCreateFacilityMutation({
    // A new facility changes the dashboard counters too.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: facilitiesQueryKey }),
        queryClient.invalidateQueries({ queryKey: statisticsQueryKey }),
      ]);
      onSuccess?.();
    },
  });

  const update = useUpdateFacilityMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: facilitiesQueryKey });
      onSuccess?.();
    },
  });

  const submit = (values: FacilityFormValues, callbacks?: SubmitCallbacks) => {
    if (facilityId) {
      update.mutate({ id: facilityId, data: toUpdateDto(values) }, callbacks);
    } else {
      create.mutate(toCreateDto(values), callbacks);
    }
  };

  const mutation = facilityId ? update : create;

  return {
    submit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
