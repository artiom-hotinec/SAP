import clsx from 'clsx';
import Image from 'next/image';
import type { ButtonHTMLAttributes } from 'react';

export interface UiIconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> {
  /** Path to a 24×24 icon in `public/`, e.g. `/icons/edit.svg`. */
  icon: string;
  /** Accessible name; the icon itself is decorative. */
  'aria-label': string;
  /** Extra classes for the icon (e.g. `rotate-180`). */
  iconClassName?: string;
}

export function UiIconButton({
  icon,
  iconClassName,
  type = 'button',
  className,
  ...props
}: UiIconButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <Image
        src={icon}
        alt=""
        width={24}
        height={24}
        className={clsx('transition-transform', iconClassName)}
      />
    </button>
  );
}
