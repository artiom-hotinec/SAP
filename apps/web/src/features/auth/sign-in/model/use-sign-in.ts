'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { sessionQueryKey, useSignInMutation } from '@/entities/session';
import type { ErrorType } from '@/shared/api';
import { ROUTES } from '@/shared/config';

export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function isInvalidCredentials(error: ErrorType<unknown> | null) {
  return error?.response?.status === 401;
}

export function useSignIn() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useSignInMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      router.replace(ROUTES.dashboard);
    },
  });
}
