import { SignOutButton } from '@/features/auth/sign-out';
import { UiLogo } from '@/shared/ui/ui-logo';

export function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8">
      <UiLogo size="lg" />
      <SignOutButton />
    </main>
  );
}
