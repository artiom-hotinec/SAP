import { useQuery } from '@tanstack/react-query';
import { providersControllerGetProvider } from '@/shared/api';
import type { ErrorType, ProviderDto } from '@/shared/api';
import { providersQueryKey } from './providers-query';

export function useProviderQuery(id: string) {
  return useQuery<ProviderDto, ErrorType<unknown>>({
    queryKey: [...providersQueryKey, 'detail', id],
    queryFn: ({ signal }) => providersControllerGetProvider(id, { signal }),
    // An unknown id won't appear on retry; show "not found" right away.
    retry: (failureCount, error) =>
      error.response?.status !== 404 && failureCount < 3,
  });
}
