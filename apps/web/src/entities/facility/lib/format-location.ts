import type { Facility } from '@/shared/api';

export function formatLocation({
  city,
  state,
}: Pick<Facility, 'city' | 'state'>): string {
  return [city, state].filter(Boolean).join(', ');
}
