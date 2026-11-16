import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export type UiAvatarSize = 'sm' | 'lg';

export interface UiAvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Initials shown in the circle (there are no photos yet). */
  initials: string;
  /** `sm` — 32px list rows; `lg` — 74px profile card with the blue ring. */
  size?: UiAvatarSize;
}

const sizeClasses: Record<UiAvatarSize, string> = {
  sm: 'size-8 text-h6',
  lg: 'size-18.5 text-h3 border-2 border-blue-300',
};

/** Round initials avatar. Decorative: the name is always rendered next to it. */
export function UiAvatar({
  initials,
  size = 'sm',
  className,
  ...props
}: UiAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-grey-700 text-white-high',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {initials}
    </span>
  );
}
