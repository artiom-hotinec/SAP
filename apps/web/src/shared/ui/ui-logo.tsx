import clsx from 'clsx';
import type { SVGAttributes } from 'react';

export type UiLogoSize = 'sm' | 'lg';

export interface UiLogoProps extends SVGAttributes<SVGSVGElement> {
  size?: UiLogoSize;
}

const sizeClasses: Record<UiLogoSize, string> = {
  sm: 'w-25.25',
  lg: 'w-58.5',
};

export function UiLogo({
  size = 'lg',
  className,
  'aria-label': ariaLabel = 'SAP',
  ...props
}: UiLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 233.9 43.16"
      fill="none"
      role="img"
      aria-label={ariaLabel}
      className={clsx(
        'block h-auto fill-red-brand',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      <path
        d="M45.7 4.3H12.94A8.64 8.64 0 0 0 12.94 21.58H37.06A8.64 8.64 0 0 1 37.06 38.86H4.3"
        fill="none"
        strokeWidth="8.6"
        className="stroke-red-brand"
      />
      <path d="M112.39 0H101.12L76.54 43.16H86.2L93.71 29.58H119.36L127.09 43.16H137.07L112.39 0ZM96.82 23.06L106.76 4.92999L116.7 23.06H96.82Z" />
      <path
        d="M173.3 43.16V4.3H211A10.5 10.5 0 0 1 211 25.3H173.3"
        fill="none"
        strokeWidth="8.6"
        className="stroke-red-brand"
      />
    </svg>
  );
}
