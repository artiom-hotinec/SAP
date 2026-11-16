'use client';

import Image from 'next/image';
import { ProviderDetails, useProviderQuery } from '@/entities/provider';
import { ROUTES } from '@/shared/config';
import { UiLink } from '@/shared/ui/ui-link';

export interface ProviderDetailsPageProps {
  id: string;
}

export function ProviderDetailsPage({ id }: ProviderDetailsPageProps) {
  const { data, isPending, isError, error } = useProviderQuery(id);

  return (
    <div className="-mt-5.5 w-full max-w-266.75">
      <UiLink
        href={ROUTES.providers}
        className="mb-5.25 inline-flex items-center gap-2 text-blue-50!"
      >
        <Image src="/icons/arrow-left.svg" alt="" width={24} height={24} />
        Back to all providers
      </UiLink>

      {isError ? (
        <p role="alert" className="text-body-md text-grey-700">
          {error.response?.status === 404
            ? 'Provider not found.'
            : 'Failed to load provider.'}
        </p>
      ) : isPending ? (
        <div
          aria-busy="true"
          aria-label="Loading provider"
          className="h-72.25 animate-pulse rounded-lg border border-grey-500 bg-grey-200"
        />
      ) : (
        <ProviderDetails provider={data} />
      )}
    </div>
  );
}
