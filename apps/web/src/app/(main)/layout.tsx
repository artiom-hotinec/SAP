import type { ReactNode } from 'react';
import { Sidebar } from '@/widgets/sidebar';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 bg-white">
      <Sidebar />
      <main className="min-w-0 flex-1 px-15 pt-11.5">{children}</main>
    </div>
  );
}
