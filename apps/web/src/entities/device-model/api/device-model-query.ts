import { useQuery } from '@tanstack/react-query';
import { deviceModelControllerGetDeviceModelByGtin } from '@/shared/api';
import type { DeviceModelDto, ErrorType } from '@/shared/api';

export const deviceModelQueryKey = ['device-model'] as const;

/** Looks a model up by the GTIN-14 from a Device ID. Disabled until `gtin` is set. */
export function useDeviceModelByGtinQuery(gtin?: string) {
  return useQuery<DeviceModelDto, ErrorType<unknown>>({
    queryKey: [...deviceModelQueryKey, gtin],
    queryFn: ({ signal }) =>
      deviceModelControllerGetDeviceModelByGtin(gtin!, { signal }),
    enabled: !!gtin,
    staleTime: 5 * 60 * 1000,
    // An unknown GTIN won't appear on retry; report "unknown model" right away.
    retry: (failureCount, error) =>
      error.response?.status !== 404 && failureCount < 3,
  });
}
