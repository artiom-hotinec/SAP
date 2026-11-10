import type { SVGProps } from 'react';

export type UiIconCameraProps = SVGProps<SVGSVGElement>;

export function UiIconCamera(props: UiIconCameraProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={17.5}
      viewBox="0 0 20 17.5"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M17.5 2.5H15.625L15 1.24998C14.6318 0.522481 14.4406 0 13.75 0H6.24997C5.55936 0 5.33124 0.596252 4.99996 1.24998L4.37495 2.5H2.5C1.11936 2.5 0 3.61936 0 4.99999V15C0 16.3806 1.11936 17.5 2.5 17.5H17.5C18.8806 17.5 20 16.3806 20 15V4.99999C19.9999 3.61939 18.8806 2.5 17.5 2.5ZM9.99998 15C7.23875 15 4.99999 12.7613 4.99999 10C4.99999 7.23878 7.23875 5.00002 9.99998 5.00002C12.7612 5.00002 15 7.23878 15 10C15 12.7613 12.7613 15 9.99998 15Z" />
      <path
        opacity="0.4"
        d="M10 6.25C7.92876 6.25 6.25 7.92876 6.25 10C6.25 12.0713 7.92876 13.75 10 13.75C12.0713 13.75 13.75 12.0713 13.75 10C13.75 7.92873 12.0713 6.25 10 6.25Z"
      />
    </svg>
  );
}
