'use client';

import clsx from 'clsx';
import { useState } from 'react';
import {
  PATIENT_ROW_GRID,
  PatientRow,
  usePatientsQuery,
} from '@/entities/patient';
import type { PatientFilterBy, PatientSortBy } from '@/shared/api';
import { useDebouncedValue } from '@/shared/lib';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiPageTitle } from '@/shared/ui/ui-page-title';
import { UiSearch } from '@/shared/ui/ui-search';
import {
  FILTER_OPTIONS,
  isFilterBy,
  isSortBy,
  SORT_OPTIONS,
} from '../config/sort-options';

const COLUMNS = ['Patient Name', 'Email', 'Phone', 'Provider Name'];

export function PatientsList() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<PatientSortBy>();
  const [filterBy, setFilterBy] = useState<PatientFilterBy>();

  const q = useDebouncedValue(search.trim());
  const { data, isPending, isError, isFetching } = usePatientsQuery({
    ...(q && { q }),
    ...(sortBy && { sortBy }),
    ...(filterBy && { filterBy }),
  });

  const count = data?.length;
  const title =
    count === undefined
      ? 'Patients'
      : `${count} ${count === 1 ? 'Patient' : 'Patients'}`;

  return (
    <div className="w-full">
      <div className="-mt-1.5 flex items-center justify-between gap-6">
        <UiPageTitle className="text-grey-800">{title}</UiPageTitle>
        <div className="flex items-center gap-6">
          <UiSearch
            className="w-90.25"
            placeholder="Search for patient"
            aria-label="Search for patient"
            value={search}
            onValueChange={setSearch}
          />
        </div>
      </div>

      <div className="mt-6.75 ml-auto flex w-fit items-center gap-4">
        <UiDropdown
          size="sm"
          className="w-62.75"
          aria-label="Filter by"
          placeholder="Filter by"
          options={FILTER_OPTIONS}
          value={filterBy}
          onChange={(value) => isFilterBy(value) && setFilterBy(value)}
        />
        <UiDropdown
          size="sm"
          className="w-62.75"
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
          PATIENT_ROW_GRID,
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
            Failed to load patients.
          </p>
        ) : isPending ? (
          <ul className="flex flex-col gap-3" aria-label="Loading patients">
            {Array.from({ length: 3 }, (_, index) => (
              <li
                key={index}
                className="h-16 animate-pulse rounded-lg border border-grey-500 bg-grey-200"
              />
            ))}
          </ul>
        ) : data.length === 0 ? (
          <p className="text-body-md text-grey-700">No patients found.</p>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Patients">
            {data.map((patient) => (
              <li key={patient.id}>
                <PatientRow patient={patient} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
