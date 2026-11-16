import { ProviderSortBy } from '@/shared/api';

export const SORT_OPTIONS: { value: ProviderSortBy; label: string }[] = [
  { value: ProviderSortBy.providerName, label: 'A-Z (Provider name)' },
  { value: ProviderSortBy.facilityName, label: 'A-Z (Facility name)' },
];

export function isSortBy(value: string): value is ProviderSortBy {
  return SORT_OPTIONS.some((option) => option.value === value);
}
