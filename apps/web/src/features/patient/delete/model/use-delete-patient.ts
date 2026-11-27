'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { patientsQueryKey, useDeletePatientMutation } from '@/entities/patient';
import { statisticsQueryKey } from '@/entities/statistics';
import { ROUTES } from '@/shared/config';

/**
 * Deletes a patient, refreshes the list and dashboard counters, and returns to
 * the patients list.
 */
export function useDeletePatient() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useDeletePatientMutation({
    onSuccess: async (_data, id) => {
      // Drop the deleted patient's page query first, so invalidating the list
      // doesn't refetch it (404) while the page is still mounted.
      queryClient.removeQueries({
        queryKey: [...patientsQueryKey, 'detail', id],
      });
      router.push(ROUTES.patients);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: patientsQueryKey }),
        queryClient.invalidateQueries({ queryKey: statisticsQueryKey }),
      ]);
    },
  });
}
