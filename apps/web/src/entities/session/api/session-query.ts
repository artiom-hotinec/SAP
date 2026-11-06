import { useQuery } from '@tanstack/react-query';
import { authControllerGetSessionInfo } from '@/shared/api';
import type { ErrorType, GetSessionInfoDto } from '@/shared/api';

export const sessionQueryKey = ['session'] as const;

export function useSessionQuery() {
  return useQuery<GetSessionInfoDto, ErrorType<unknown>>({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => authControllerGetSessionInfo({ signal }),
    retry: false,
  });
}
