'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSignOutMutation } from '@/entities/session';
import { ROUTES } from '@/shared/config';

export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useSignOutMutation({
    onSuccess: () => {
      queryClient.clear();
      router.replace(ROUTES.signIn);
    },
  });
}
