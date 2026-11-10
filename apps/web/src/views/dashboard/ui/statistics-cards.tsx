'use client';

import { useStatisticsQuery } from '@/entities/statistics';
import { UiStatCard } from '@/shared/ui/ui-stat-card';
import { STAT_CARDS } from '../config/stat-cards';

export function StatisticsCards() {
  const { data, isPending, isError } = useStatisticsQuery();

  if (isError) {
    return (
      <p role="alert" className="text-body-md text-grey-700">
        Failed to load statistics.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-6">
      {STAT_CARDS.map(({ key, label, Icon }) => (
        <UiStatCard
          key={key}
          label={label}
          value={data?.[key]}
          loading={isPending}
          icon={<Icon />}
        />
      ))}
    </div>
  );
}
