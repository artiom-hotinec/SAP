'use client';

import { UiButton } from '@/shared/ui/ui-button';
import { useSignOut } from '../model/use-sign-out';

export interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const { mutate, isPending } = useSignOut();

  return (
    <UiButton
      variant="cancel"
      className={className}
      disabled={isPending}
      onClick={() => mutate()}
    >
      Sign Out
    </UiButton>
  );
}
