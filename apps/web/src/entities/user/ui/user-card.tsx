'use client';

import clsx from 'clsx';
import { useUserQuery } from '../api/user-query';
import { getDisplayName } from '../lib/get-display-name';
import { getInitials } from '../lib/get-initials';
import { getRoleLabel } from '../lib/get-role-label';

export interface UserCardProps {
  className?: string;
}

export function UserCard({ className }: UserCardProps) {
  const { data: user, isPending } = useUserQuery();

  if (!isPending && !user) return null;

  return (
    <div
      className={clsx(
        'flex h-17 w-53.25 items-center gap-1.75 rounded-[10px] bg-grey-800 px-2.25',
        className,
      )}
      aria-busy={isPending || undefined}
    >
      {user ? (
        <>
          <span
            className="flex size-12.5 shrink-0 items-center justify-center rounded-full bg-grey-700 text-h4 text-white-high"
            aria-hidden="true"
          >
            {getInitials(user)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-body-md font-bold text-white">
              {getDisplayName(user)}
            </p>
            <p className="truncate text-body-md leading-5.5 font-light text-white/50">
              {getRoleLabel(user.role)}
            </p>
          </div>
        </>
      ) : (
        <>
          <span
            className="size-12.5 shrink-0 animate-pulse rounded-full bg-grey-700"
            aria-hidden="true"
          />
          <div className="flex-1 space-y-2" aria-hidden="true">
            <div className="h-3.5 w-24 animate-pulse rounded bg-grey-700" />
            <div className="h-3.5 w-16 animate-pulse rounded bg-grey-700" />
          </div>
        </>
      )}
    </div>
  );
}
