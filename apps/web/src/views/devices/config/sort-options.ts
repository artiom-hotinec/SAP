import { DeviceSortBy } from '@/shared/api';

export const SORT_OPTIONS: { value: DeviceSortBy; label: string }[] = [
  { value: DeviceSortBy.model, label: 'A-Z (Model)' },
  { value: DeviceSortBy.dateAdded, label: 'Date Added' },
];

export function isSortBy(value: string): value is DeviceSortBy {
  return SORT_OPTIONS.some((option) => option.value === value);
}
