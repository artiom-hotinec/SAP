'use client';

import clsx from 'clsx';
import { useState } from 'react';
import {
  PROVIDER_ROW_GRID,
  ProviderRow,
  useProvidersQuery,
} from '@/entities/provider';
import type { ProviderSortBy } from '@/shared/api';
import { useDebouncedValue } from '@/shared/lib';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiPageTitle } from '@/shared/ui/ui-page-title';
import { UiSearch } from '@/shared/ui/ui-search';
import { isSortBy, SORT_OPTIONS } from '../config/sort-options';

const COLUMNS = ['Provider Name', 'Email', 'NPI', 'Facility Name'];

export function ProvidersList() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<ProviderSortBy>();

  const q = useDebouncedValue(search.trim());
  const { data, isPending, isError, isFetching } = useProvidersQuery({
    ...(q && { q }),
    ...(sortBy && { sortBy }),
  });

  const count = data?.length;
  const title =
    count === undefined
      ? 'Providers'
      : `${count} ${count === 1 ? 'Provider' : 'Providers'}`;

  return (
    <div className="w-full">
      <div className="-mt-1.5 flex items-center justify-between gap-6">
        <UiPageTitle className="text-grey-800">{title}</UiPageTitle>
        <div className="flex items-center gap-6">
          <UiSearch
            className="w-90.25"
            placeholder="Search for provider"
            aria-label="Search for provider"
            value={search}
            onValueChange={setSearch}
          />
        </div>
      </div>

      <div className="mt-6.75 ml-auto w-62.75">
        <UiDropdown
          size="sm"
          aria-label="Sort by"
          placeholder="Sort by"
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={(value) => isSortBy(value) && setSortBy(value)}
        />
      </div>

      <div
        aria-hidden="true"
        className={clsx(
          PROVIDER_ROW_GRID,
          'mt-6.25 h-12 text-body-md font-bold whitespace-nowrap text-grey-700',
        )}
      >
        {COLUMNS.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>

      <div className="mt-6" aria-busy={isFetching || undefined}>
        {isError ? (
          <p role="alert" className="text-body-md text-grey-700">
            Failed to load providers.
          </p>
        ) : isPending ? (
          <ul className="flex flex-col gap-3" aria-label="Loading providers">
            {Array.from({ length: 3 }, (_, index) => (
              <li
                key={index}
                className="h-16 animate-pulse rounded-lg border border-grey-500 bg-grey-200"
              />
            ))}
          </ul>
        ) : data.length === 0 ? (
          <p className="text-body-md text-grey-700">No providers found.</p>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Providers">
            {data.map((provider) => (
              <li key={provider.id}>
                <ProviderRow provider={provider} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
