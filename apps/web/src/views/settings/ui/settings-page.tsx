import { UiPageTitle } from '@/shared/ui/ui-page-title';
import { AccountSection } from './account-section';
import { UrgentEmailCard } from './urgent-email-card';

export function SettingsPage() {
  return (
    <div className="w-full max-w-266.75">
      <UiPageTitle>Settings</UiPageTitle>
      <div className="mt-6 flex flex-col gap-6">
        <AccountSection />
        <UrgentEmailCard />
      </div>
    </div>
  );
}
