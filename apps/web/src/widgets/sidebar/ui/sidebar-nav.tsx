'use client';

import { usePathname } from 'next/navigation';
import { SidebarNavList } from './sidebar-nav-list';

export function SidebarNav() {
  return <SidebarNavList pathname={usePathname()} />;
}
