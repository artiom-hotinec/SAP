'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  facilitiesQueryKey,
  useDeleteFacilityMutation,
} from '@/entities/facility';
import { statisticsQueryKey } from '@/entities/statistics';

export function useDeleteFacility() {
  const queryClient = useQueryClient();

  return useDeleteFacilityMutation({
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: facilitiesQueryKey }),
        queryClient.invalidateQueries({ queryKey: statisticsQueryKey }),
      ]),
  });
}
