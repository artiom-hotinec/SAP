'use client';

import clsx from 'clsx';
import { UiButton } from '@/shared/ui/ui-button';
import { useSignOut } from '../model/use-sign-out';

export interface SignOutButtonProps {
  className?: string;
  appearance?: 'button' | 'link';
}

export function SignOutButton({
  className,
  appearance = 'button',
}: SignOutButtonProps) {
  const { mutate, isPending } = useSignOut();

  if (appearance === 'link') {
    return (
      <button
        type="button"
        className={clsx(
          'cursor-pointer text-body-md font-bold text-blue-50 hover:text-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-50 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        disabled={isPending}
        onClick={() => mutate()}
      >
        Sign out
      </button>
    );
  }

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
