import type { SVGProps } from 'react';

export type UiIconStatsProps = SVGProps<SVGSVGElement>;

export function UiIconStats(props: UiIconStatsProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M10 3H14V21H10V3Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M18 8H22V21H18V8Z" />
      <path fillRule="evenodd" clipRule="evenodd" d="M2 13H6V21H2V13Z" />
    </svg>
  );
}
