import { useQuery } from '@tanstack/react-query';
import { userControllerGetUser } from '@/shared/api';
import type { ErrorType, UserDto } from '@/shared/api';

export const userQueryKey = ['user'] as const;

export function useUserQuery() {
  return useQuery<UserDto, ErrorType<unknown>>({
    queryKey: userQueryKey,
    queryFn: ({ signal }) => userControllerGetUser({ signal }),
    retry: false,
  });
}
