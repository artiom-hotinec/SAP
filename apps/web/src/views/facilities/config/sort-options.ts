import { FacilitySortBy } from '@/shared/api';

export const SORT_OPTIONS: { value: FacilitySortBy; label: string }[] = [
  { value: FacilitySortBy.name, label: 'A-Z (Facility name)' },
  { value: FacilitySortBy.dateAdded, label: 'Date Added' },
];

export function isSortBy(value: string): value is FacilitySortBy {
  return SORT_OPTIONS.some((option) => option.value === value);
}
