import clsx from 'clsx';
import Link from 'next/link';
import type { ComponentProps } from 'react';

export type UiLinkSize = 'md' | 'lg';

export interface UiLinkProps extends ComponentProps<typeof Link> {
  size?: UiLinkSize;
}

const sizeClasses: Record<UiLinkSize, string> = {
  md: 'text-body-md',
  lg: 'text-body-lg',
};

export function UiLink({
  size = 'md',
  className,
  children,
  ...props
}: UiLinkProps) {
  return (
    <Link
      className={clsx(
        'font-bold text-blue-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
