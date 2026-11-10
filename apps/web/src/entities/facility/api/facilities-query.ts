import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getFacilities } from '@/shared/api';
import type { ErrorType, Facility, GetFacilitiesParams } from '@/shared/api';

export const facilitiesQueryKey = ['facilities'] as const;

export function useFacilitiesQuery(params: GetFacilitiesParams = {}) {
  return useQuery<Facility[], ErrorType<unknown>>({
    queryKey: [...facilitiesQueryKey, params],
    queryFn: ({ signal }) => getFacilities(params, { signal }),
    placeholderData: keepPreviousData,
  });
}
