'use client';

import { AccountInformation, useUserQuery } from '@/entities/user';
import { ChangePasswordButton } from '@/features/user/change-password';

export function AccountSection() {
  const { data, isPending, isError } = useUserQuery();

  if (isError) {
    return (
      <p role="alert" className="text-body-md text-grey-700">
        Failed to load account information.
      </p>
    );
  }

  if (isPending) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading account information"
        className="h-72.25 animate-pulse rounded-lg border border-grey-500 bg-grey-200"
      />
    );
  }

  return <AccountInformation user={data} actions={<ChangePasswordButton />} />;
}
