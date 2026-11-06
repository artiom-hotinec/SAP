'use client';

import { PropsWithChildren } from 'react';
import { QueryProvider } from './QueryProvider';

export function Providers({ children }: PropsWithChildren) {
  return <QueryProvider>{children}</QueryProvider>;
}
