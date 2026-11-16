import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { userControllerChangePassword } from '@/shared/api';
import type { ChangePasswordBodyDto, ErrorType } from '@/shared/api';

type MutationOptions<TVariables> = Omit<
  UseMutationOptions<unknown, ErrorType<unknown>, TVariables>,
  'mutationFn'
>;

export function useChangePasswordMutation(
  options?: MutationOptions<ChangePasswordBodyDto>,
) {
  return useMutation({
    ...options,
    mutationFn: (data: ChangePasswordBodyDto) =>
      userControllerChangePassword(data),
  });
}
