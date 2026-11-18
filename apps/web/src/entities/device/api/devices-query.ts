import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { deviceControllerGetAllDevices } from '@/shared/api';
import type {
  DeviceControllerGetAllDevicesParams,
  DeviceDto,
  ErrorType,
} from '@/shared/api';

export const devicesQueryKey = ['devices'] as const;

export function useDevicesQuery(
  params: DeviceControllerGetAllDevicesParams = {},
) {
  return useQuery<DeviceDto[], ErrorType<unknown>>({
    queryKey: [...devicesQueryKey, params],
    queryFn: ({ signal }) => deviceControllerGetAllDevices(params, { signal }),
    placeholderData: keepPreviousData,
  });
}
