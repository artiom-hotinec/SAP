import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import {
  facilitiesControllerCreateFacility,
  facilitiesControllerDeleteFacility,
  facilitiesControllerUpdateFacility,
} from '@/shared/api';
import type {
  AddFacilityItemDto,
  ErrorType,
  UpdateFacilityItemDto,
} from '@/shared/api';

type MutationOptions<TVariables> = Omit<
  UseMutationOptions<unknown, ErrorType<unknown>, TVariables>,
  'mutationFn'
>;

export interface UpdateFacilityVariables {
  id: string;
  data: UpdateFacilityItemDto;
}

export function useCreateFacilityMutation(
  options?: MutationOptions<AddFacilityItemDto>,
) {
  return useMutation({
    ...options,
    mutationFn: (data: AddFacilityItemDto) =>
      facilitiesControllerCreateFacility(data),
  });
}

export function useUpdateFacilityMutation(
  options?: MutationOptions<UpdateFacilityVariables>,
) {
  return useMutation({
    ...options,
    mutationFn: ({ id, data }: UpdateFacilityVariables) =>
      facilitiesControllerUpdateFacility(id, data),
  });
}

export function useDeleteFacilityMutation(options?: MutationOptions<string>) {
  return useMutation({
    ...options,
    mutationFn: (id: string) => facilitiesControllerDeleteFacility(id),
  });
}
