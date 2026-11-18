'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  deviceModelQueryKey,
  useCreateDeviceModelMutation,
} from '@/entities/device-model';

export interface UseCreateDeviceModelOptions {
  /** Called after the cache is refreshed. */
  onSuccess?: () => void;
}

export function useCreateDeviceModel({
  onSuccess,
}: UseCreateDeviceModelOptions = {}) {
  const queryClient = useQueryClient();

  return useCreateDeviceModelMutation({
    // An open Add Device form may be showing "Unknown model" for this GTIN.
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: deviceModelQueryKey });
      onSuccess?.();
    },
  });
}
