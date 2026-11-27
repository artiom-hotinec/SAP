import { PatientFilterBy, PatientSortBy } from '@/shared/api';

// `unreadMessages` is not offered: the API falls back to newest first.
export const SORT_OPTIONS: { value: PatientSortBy; label: string }[] = [
  { value: PatientSortBy.lastName, label: 'A-Z (Last name)' },
  { value: PatientSortBy.dateAdded, label: 'Date Added' },
];

// `filterBy` accepts a single value only, so the filter is a single select.
export const FILTER_OPTIONS: { value: PatientFilterBy; label: string }[] = [
  { value: PatientFilterBy.allPatients, label: 'All patients' },
  { value: PatientFilterBy.activePatients, label: 'Active patients' },
  { value: PatientFilterBy.inActivePatients, label: 'Inactive patients' },
  { value: PatientFilterBy.myPatients, label: 'My patients' },
];

export function isSortBy(value: string): value is PatientSortBy {
  return SORT_OPTIONS.some((option) => option.value === value);
}

export function isFilterBy(value: string): value is PatientFilterBy {
  return FILTER_OPTIONS.some((option) => option.value === value);
}
