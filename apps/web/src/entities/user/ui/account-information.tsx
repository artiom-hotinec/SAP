import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';
import type { UserDto } from '@/shared/api';
import { UiAvatar } from '@/shared/ui/ui-avatar';
import { UiReadonlyField } from '@/shared/ui/ui-readonly-field';
import { getInitials } from '../lib/get-initials';

export interface AccountInformationProps extends HTMLAttributes<HTMLElement> {
  user: UserDto;
  /** Rendered at the right of the card header (e.g. "Change password"). */
  actions?: ReactNode;
}

export function AccountInformation({
  user,
  actions,
  className,
  ...props
}: AccountInformationProps) {
  return (
    <section
      aria-labelledby="account-information-title"
      className={clsx('rounded-lg border border-grey-500 bg-white', className)}
      {...props}
    >
      <div className="flex h-17 items-center justify-between border-b border-grey-500 px-6">
        <h2
          id="account-information-title"
          className="text-body-md font-bold text-grey-700"
        >
          Account Information
        </h2>
        {actions}
      </div>

      <div className="flex gap-18.5 px-6 pt-6 pb-6.25">
        <UiAvatar size="lg" initials={getInitials(user)} />
        <div className="grid grid-cols-[repeat(3,220px)] gap-x-20.75 gap-y-6.5">
          <UiReadonlyField label="First Name" value={user.firstName || '--'} />
          <UiReadonlyField label="Last Name" value={user.lastName || '--'} />
          <UiReadonlyField
            label="Password"
            value={<span aria-label="Password hidden">•••••••••</span>}
          />
          <UiReadonlyField label="Email" value={user.email || '--'} />
          <UiReadonlyField label="Phone" value={user.phone || '--'} />
        </div>
      </div>
    </section>
  );
}
