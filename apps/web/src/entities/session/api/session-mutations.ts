import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { authControllerSignIn, authControllerSignOut } from '@/shared/api';
import type { ErrorType, SignInBodyDto } from '@/shared/api';

type MutationOptions<TVariables> = Omit<
  UseMutationOptions<void, ErrorType<unknown>, TVariables>,
  'mutationFn'
>;

export function useSignInMutation(options?: MutationOptions<SignInBodyDto>) {
  return useMutation({
    ...options,
    mutationFn: (body: SignInBodyDto) => authControllerSignIn(body),
  });
}

export function useSignOutMutation(options?: MutationOptions<void>) {
  return useMutation({
    ...options,
    mutationFn: () => authControllerSignOut(),
  });
}
