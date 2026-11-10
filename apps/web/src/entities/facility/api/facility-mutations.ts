import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { facilitiesControllerDeleteFacility } from '@/shared/api';
import type { ErrorType } from '@/shared/api';

type MutationOptions<TVariables> = Omit<
  UseMutationOptions<unknown, ErrorType<unknown>, TVariables>,
  'mutationFn'
>;

export function useDeleteFacilityMutation(options?: MutationOptions<string>) {
  return useMutation({
    ...options,
    mutationFn: (id: string) => facilitiesControllerDeleteFacility(id),
  });
}
