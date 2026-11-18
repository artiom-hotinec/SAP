import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import {
  deviceControllerCreateDevice,
  deviceControllerDeleteDevice,
  deviceControllerUpdateDevice,
} from '@/shared/api';
import type {
  AddDeviceItemDto,
  DeviceDto,
  ErrorType,
  UpdateDeviceItemDto,
} from '@/shared/api';

type MutationOptions<TVariables> = Omit<
  UseMutationOptions<DeviceDto, ErrorType<unknown>, TVariables>,
  'mutationFn'
>;

export interface UpdateDeviceVariables {
  id: string;
  data: UpdateDeviceItemDto;
}

export function useCreateDeviceMutation(
  options?: MutationOptions<AddDeviceItemDto>,
) {
  return useMutation({
    ...options,
    mutationFn: (data: AddDeviceItemDto) => deviceControllerCreateDevice(data),
  });
}

export function useUpdateDeviceMutation(
  options?: MutationOptions<UpdateDeviceVariables>,
) {
  return useMutation({
    ...options,
    mutationFn: ({ id, data }: UpdateDeviceVariables) =>
      deviceControllerUpdateDevice(id, data),
  });
}

export function useDeleteDeviceMutation(options?: MutationOptions<string>) {
  return useMutation({
    ...options,
    mutationFn: (id: string) => deviceControllerDeleteDevice(id),
  });
}
