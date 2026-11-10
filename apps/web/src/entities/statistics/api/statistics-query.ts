import { useQuery } from '@tanstack/react-query';
import { statisticsControllerGetStatistics } from '@/shared/api';
import type { ErrorType, StatisticsDto } from '@/shared/api';

export const statisticsQueryKey = ['statistics'] as const;

export function useStatisticsQuery() {
  return useQuery<StatisticsDto, ErrorType<unknown>>({
    queryKey: statisticsQueryKey,
    queryFn: ({ signal }) => statisticsControllerGetStatistics({ signal }),
  });
}
