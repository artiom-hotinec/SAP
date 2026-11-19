import clsx from 'clsx';
import type { HTMLAttributes } from 'react';
import type { ProviderDto } from '@/shared/api';
import { formatDate, getInitials } from '@/shared/lib';
import { UiAvatar } from '@/shared/ui/ui-avatar';
import { UiReadonlyField } from '@/shared/ui/ui-readonly-field';

export interface ProviderDetailsProps extends HTMLAttributes<HTMLElement> {
  provider: ProviderDto;
}

export function ProviderDetails({
  provider,
  className,
  ...props
}: ProviderDetailsProps) {
  const titleId = `provider-details-${provider.id}`;

  return (
    <section
      aria-labelledby={titleId}
      className={clsx('rounded-lg border border-grey-500 bg-white', className)}
      {...props}
    >
      <h2
        id={titleId}
        className="flex h-17 items-center border-b border-grey-500 px-6 text-body-md font-bold text-grey-700"
      >
        Provider Information
      </h2>

      <div className="flex gap-18.5 px-6 pt-6 pb-6.25">
        <UiAvatar size="lg" initials={getInitials(provider, provider.email)} />
        <div className="grid grid-cols-[repeat(3,220px)] gap-x-20.75 gap-y-6.5">
          <UiReadonlyField
            label="First Name"
            value={provider.firstName || '--'}
          />
          <UiReadonlyField
            label="Last Name"
            value={provider.lastName || '--'}
          />
          <UiReadonlyField
            label="Date Hired"
            value={provider.dateHired ? formatDate(provider.dateHired) : '--'}
          />
          <UiReadonlyField
            label="Email"
            value={
              <a
                href={`mailto:${provider.email}`}
                className="hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {provider.email}
              </a>
            }
          />
          <UiReadonlyField label="NPI" value={provider.npi ?? '--'} />
          <UiReadonlyField
            label="Facility Name"
            value={provider.facilityName}
          />
        </div>
      </div>
    </section>
  );
}
