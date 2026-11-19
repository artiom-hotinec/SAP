import clsx from 'clsx';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import type { ProviderDto } from '@/shared/api';
import { providerDetailsRoute } from '@/shared/config';
import { getInitials } from '@/shared/lib';
import { UiAvatar } from '@/shared/ui/ui-avatar';
import { PROVIDER_ROW_GRID } from '../config/row-grid';

export interface ProviderRowProps extends Omit<
  ComponentProps<typeof Link>,
  'href' | 'children'
> {
  provider: ProviderDto;
}

/** List row; the whole row links to the provider's details page. */
export function ProviderRow({
  provider,
  className,
  ...props
}: ProviderRowProps) {
  return (
    <Link
      href={providerDetailsRoute(provider.id)}
      className={clsx(
        PROVIDER_ROW_GRID,
        'h-16 rounded-lg border border-grey-500 bg-white text-body-md leading-5.5 text-grey-700 transition-colors hover:bg-grey-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200',
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-4 pr-4">
        <UiAvatar initials={getInitials(provider, provider.email)} />
        <span className="truncate">{provider.providerName}</span>
      </span>
      <span className="truncate pr-4">{provider.email}</span>
      <span className="truncate pr-4">{provider.npi ?? '--'}</span>
      <span className="truncate">{provider.facilityName}</span>
    </Link>
  );
}
