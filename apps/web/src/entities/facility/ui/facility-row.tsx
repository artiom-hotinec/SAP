'use client';

import clsx from 'clsx';
import { useId } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import type { Facility } from '@/shared/api';
import { formatDate } from '@/shared/lib';
import { UiIconButton } from '@/shared/ui/ui-icon-button';
import { FACILITY_ROW_GRID } from '../config/row-grid';
import { formatLocation } from '../lib/format-location';

export interface FacilityRowProps extends HTMLAttributes<HTMLDivElement> {
  facility: Facility;
  expanded?: boolean;
  onToggle?: () => void;
  /** Rendered under the summary while expanded (e.g. `FacilityDetails`). */
  details?: ReactNode;
}

export function FacilityRow({
  facility,
  expanded = false,
  onToggle,
  details,
  className,
  ...props
}: FacilityRowProps) {
  const detailsId = useId();

  return (
    <div
      className={clsx(
        'rounded-lg border border-grey-500 bg-white text-body-md leading-5.5 text-grey-700',
        className,
      )}
      {...props}
    >
      <div className={clsx(FACILITY_ROW_GRID, 'h-16')}>
        <span className="truncate pr-4">{facility.name}</span>
        <span className="truncate pr-4">{formatLocation(facility)}</span>
        <span className="truncate pr-4">{facility.phone}</span>
        <span className="truncate">{formatDate(facility.createdAt)}</span>
        <UiIconButton
          icon="/icons/chevron-down.svg"
          aria-label={`${expanded ? 'Hide' : 'Show'} details for ${facility.name}`}
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={onToggle}
          iconClassName={clsx(expanded && 'rotate-180')}
        />
      </div>
      <div id={detailsId} hidden={!expanded}>
        {expanded && details}
      </div>
    </div>
  );
}
