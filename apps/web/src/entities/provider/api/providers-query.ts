import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { providersControllerGetProviders } from '@/shared/api';
import type {
  ErrorType,
  ProviderDto,
  ProvidersControllerGetProvidersParams,
} from '@/shared/api';

export const providersQueryKey = ['providers'] as const;

export function useProvidersQuery(
  params: ProvidersControllerGetProvidersParams = {},
) {
  return useQuery<ProviderDto[], ErrorType<unknown>>({
    queryKey: [...providersQueryKey, 'list', params],
    queryFn: ({ signal }) =>
      providersControllerGetProviders(params, { signal }),
    placeholderData: keepPreviousData,
  });
}
