'use client';

import clsx from 'clsx';
import { useState } from 'react';
import {
  FACILITY_ROW_GRID,
  FacilityDetails,
  FacilityRow,
  useFacilitiesQuery,
} from '@/entities/facility';
import { DeleteFacilityButton } from '@/features/facility/delete';
import {
  CreateFacilityButton,
  EditFacilityButton,
} from '@/features/facility/upsert';
import type { FacilitySortBy } from '@/shared/api';
import { useDebouncedValue } from '@/shared/lib';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiPageTitle } from '@/shared/ui/ui-page-title';
import { UiSearch } from '@/shared/ui/ui-search';
import { isSortBy, SORT_OPTIONS } from '../config/sort-options';

const COLUMNS = ['Facility Name', 'City, State', 'Phone Number', 'Date Added'];

export function FacilitiesList() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<FacilitySortBy>();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const q = useDebouncedValue(search.trim());
  const { data, isPending, isError, isFetching } = useFacilitiesQuery({
    ...(q && { q }),
    ...(sortBy && { sortBy }),
  });

  const count = data?.length;
  const title =
    count === undefined
      ? 'Facilities'
      : `${count} ${count === 1 ? 'Facility' : 'Facilities'}`;

  return (
    <div className="w-full">
      <div className="-mt-1.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <UiPageTitle className="text-grey-800">{title}</UiPageTitle>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-6">
          <UiSearch
            className="w-full min-w-0 sm:w-90.25"
            placeholder="Search for facility"
            aria-label="Search for facility"
            value={search}
            onValueChange={setSearch}
          />
          <CreateFacilityButton />
        </div>
      </div>

      <div className="mt-6.75 ml-auto w-full max-w-62.75">
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
          FACILITY_ROW_GRID,
          'mt-6.25 h-12 text-body-md font-bold whitespace-nowrap text-grey-700',
        )}
      >
        {COLUMNS.map((column) => (
          <span key={column} className="truncate pr-4">
            {column}
          </span>
        ))}
      </div>

      <div className="mt-6" aria-busy={isFetching || undefined}>
        {isError ? (
          <p role="alert" className="text-body-md text-grey-700">
            Failed to load facilities.
          </p>
        ) : isPending ? (
          <ul className="flex flex-col gap-3" aria-label="Loading facilities">
            {Array.from({ length: 3 }, (_, index) => (
              <li
                key={index}
                className="h-16 animate-pulse rounded-lg border border-grey-500 bg-grey-200"
              />
            ))}
          </ul>
        ) : data.length === 0 ? (
          <p className="text-body-md text-grey-700">No facilities found.</p>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Facilities">
            {data.map((facility) => {
              const expanded = facility.id === expandedId;

              return (
                <li key={facility.id}>
                  <FacilityRow
                    facility={facility}
                    expanded={expanded}
                    onToggle={() =>
                      setExpandedId(expanded ? null : facility.id)
                    }
                    details={
                      <FacilityDetails
                        facility={facility}
                        actions={
                          <>
                            <EditFacilityButton facility={facility} />
                            <DeleteFacilityButton facility={facility} />
                          </>
                        }
                      />
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
