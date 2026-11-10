import type { SVGProps } from 'react';

export type UiIconProviderProps = SVGProps<SVGSVGElement>;

export function UiIconProvider(props: UiIconProviderProps) {
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
      <path
        opacity="0.4"
        d="M11.9953 9.89503C14.9618 9.89503 17.3667 7.67995 17.3667 4.94752C17.3667 2.21509 14.9618 0 11.9953 0C9.02874 0 6.62386 2.21509 6.62386 4.94752C6.62386 7.67995 9.02874 9.89503 11.9953 9.89503Z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23 17.4999C23 20.5374 18.0751 23 12 23C5.92489 23 1 20.5374 1 17.4999C1 14.4623 5.92489 12 12 12C18.0751 12 23 14.4623 23 17.4999ZM14.0538 15.6839H16.2252V19.3683H14.0538V21.4734H9.93952V19.3683H7.76807V15.6839H9.93952V13.6838H14.0538V15.6839Z"
      />
    </svg>
  );
}
