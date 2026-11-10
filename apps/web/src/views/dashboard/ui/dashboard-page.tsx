import { UiPageTitle } from '@/shared/ui/ui-page-title';
import { StatisticsCards } from './statistics-cards';

export function DashboardPage() {
  return (
    <>
      <UiPageTitle>Dashboard</UiPageTitle>
      <div className="mt-7.25">
        <StatisticsCards />
      </div>
    </>
  );
}
