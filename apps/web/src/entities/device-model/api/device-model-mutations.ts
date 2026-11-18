import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { deviceModelControllerCreateDeviceModel } from '@/shared/api';
import type {
  AddDeviceModelItemDto,
  DeviceModelDto,
  ErrorType,
} from '@/shared/api';

type MutationOptions<TVariables> = Omit<
  UseMutationOptions<DeviceModelDto, ErrorType<unknown>, TVariables>,
  'mutationFn'
>;

export function useCreateDeviceModelMutation(
  options?: MutationOptions<AddDeviceModelItemDto>,
) {
  return useMutation({
    ...options,
    mutationFn: (data: AddDeviceModelItemDto) =>
      deviceModelControllerCreateDeviceModel(data),
  });
}
