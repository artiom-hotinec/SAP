'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  devicesQueryKey,
  useCreateDeviceMutation,
  useUpdateDeviceMutation,
} from '@/entities/device';
import { statisticsQueryKey } from '@/entities/statistics';
import type { ErrorType } from '@/shared/api';
import { toCreateDto, toUpdateDto } from './form-values';
import type { DeviceFormValues } from './form-values';

export interface UseUpsertDeviceOptions {
  /** Set to update that device; omit to create a new one. */
  deviceId?: string;
  /** Called after the cache is refreshed. */
  onSuccess?: () => void;
}

export interface SubmitCallbacks {
  onError?: (error: ErrorType<unknown>) => void;
}

export function useUpsertDevice({
  deviceId,
  onSuccess,
}: UseUpsertDeviceOptions) {
  const queryClient = useQueryClient();

  const create = useCreateDeviceMutation({
    // A new device changes the dashboard counters too.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: devicesQueryKey }),
        queryClient.invalidateQueries({ queryKey: statisticsQueryKey }),
      ]);
      onSuccess?.();
    },
  });

  const update = useUpdateDeviceMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: devicesQueryKey });
      onSuccess?.();
    },
  });

  const submit = (values: DeviceFormValues, callbacks?: SubmitCallbacks) => {
    if (deviceId) {
      update.mutate({ id: deviceId, data: toUpdateDto(values) }, callbacks);
    } else {
      create.mutate(toCreateDto(values), callbacks);
    }
  };

  const mutation = deviceId ? update : create;

  return {
    submit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
