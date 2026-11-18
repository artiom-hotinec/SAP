'use client';

import { useQueryClient } from '@tanstack/react-query';
import { devicesQueryKey, useDeleteDeviceMutation } from '@/entities/device';
import { statisticsQueryKey } from '@/entities/statistics';

export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useDeleteDeviceMutation({
    // Devices are counted on the dashboard too.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: devicesQueryKey }),
        queryClient.invalidateQueries({ queryKey: statisticsQueryKey }),
      ]),
  });
}
