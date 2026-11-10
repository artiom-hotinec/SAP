import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export type UiPageTitleProps = HTMLAttributes<HTMLHeadingElement>;

export function UiPageTitle({ className, ...props }: UiPageTitleProps) {
  return <h1 className={clsx('text-h3 text-grey-700', className)} {...props} />;
}
