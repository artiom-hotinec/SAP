import { Suspense } from 'react';
import { UserCard } from '@/entities/user';
import { SignOutButton } from '@/features/auth/sign-out';
import { UiLogo } from '@/shared/ui/ui-logo';
import { SidebarNav } from './sidebar-nav';
import { SidebarNavList } from './sidebar-nav-list';

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-63.25 shrink-0 flex-col bg-grey-900">
      <div className="mx-5 h-23 border-b border-grey-500/10 pt-6">
        <UiLogo size="sm" />
        <p className="mt-1.75 text-h5 text-white-high">Master Portal</p>
      </div>
      <div className="mt-5">
        {/* usePathname suspends on routes with runtime params (/providers/[id]) */}
        <Suspense fallback={<SidebarNavList pathname="" />}>
          <SidebarNav />
        </Suspense>
      </div>
      <div className="mt-auto flex flex-col items-end gap-4 px-5 pb-5.5">
        <UserCard className="w-full" />
        <SignOutButton appearance="link" />
      </div>
    </aside>
  );
}
