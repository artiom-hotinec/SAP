'use client';

import clsx from 'clsx';
import { useState } from 'react';
import {
  DEVICE_ROW_GRID,
  DeviceDetails,
  DeviceRow,
  useDevicesQuery,
} from '@/entities/device';
import { DeleteDeviceButton } from '@/features/device/delete';
import { CreateDeviceButton, EditDeviceButton } from '@/features/device/upsert';
import { AddDeviceModelButton } from '@/features/device-model/create';
import type { DeviceSortBy } from '@/shared/api';
import { useDebouncedValue } from '@/shared/lib';
import { UiDropdown } from '@/shared/ui/ui-dropdown';
import { UiPageTitle } from '@/shared/ui/ui-page-title';
import { UiSearch } from '@/shared/ui/ui-search';
import { isSortBy, SORT_OPTIONS } from '../config/sort-options';

const COLUMNS = ['Model', 'Device ID', 'Date of Manufacture', 'Facility'];

export function DevicesList() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<DeviceSortBy>();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const q = useDebouncedValue(search.trim());
  const { data, isPending, isError, isFetching } = useDevicesQuery({
    ...(q && { q }),
    ...(sortBy && { sortBy }),
  });

  const count = data?.length;
  const title =
    count === undefined
      ? 'Devices'
      : `${count} ${count === 1 ? 'Device' : 'Devices'}`;

  return (
    <div className="w-full">
      <div className="-mt-1.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <UiPageTitle className="text-grey-800">{title}</UiPageTitle>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-6">
          <UiSearch
            className="w-full min-w-0 sm:w-90.25"
            placeholder="Search for device ID"
            aria-label="Search for device ID"
            value={search}
            onValueChange={setSearch}
          />
          <CreateDeviceButton />
        </div>
      </div>

      <div className="mt-6.75 flex items-center justify-between gap-6">
        <AddDeviceModelButton />
        <div className="w-full max-w-62.75">
          <UiDropdown
            size="sm"
            aria-label="Sort by"
            placeholder="Sort by"
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={(value) => isSortBy(value) && setSortBy(value)}
          />
        </div>
      </div>

      <div
        aria-hidden="true"
        className={clsx(
          DEVICE_ROW_GRID,
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
            Failed to load devices.
          </p>
        ) : isPending ? (
          <ul className="flex flex-col gap-3" aria-label="Loading devices">
            {Array.from({ length: 3 }, (_, index) => (
              <li
                key={index}
                className="h-16 animate-pulse rounded-lg border border-grey-500 bg-grey-200"
              />
            ))}
          </ul>
        ) : data.length === 0 ? (
          <p className="text-body-md text-grey-700">No devices found.</p>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Devices">
            {data.map((device) => {
              const expanded = device.id === expandedId;

              return (
                <li key={device.id}>
                  <DeviceRow
                    device={device}
                    expanded={expanded}
                    onToggle={() => setExpandedId(expanded ? null : device.id)}
                    details={
                      <DeviceDetails
                        device={device}
                        actions={
                          <>
                            <EditDeviceButton device={device} />
                            <DeleteDeviceButton device={device} />
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
