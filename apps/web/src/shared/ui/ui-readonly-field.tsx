import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export interface UiReadonlyFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
}

/** Read-only label/value pair with an underline (details panels). Set width via `className`. */
export function UiReadonlyField({
  label,
  value,
  className,
  ...props
}: UiReadonlyFieldProps) {
  return (
    <div className={clsx('min-w-0', className)} {...props}>
      <p className="text-body-md font-bold whitespace-nowrap text-grey-700">
        {label}
      </p>
      <div className="mt-3.75 min-h-5.5 truncate border-b border-grey-500 pb-4 text-body-md leading-5.5 font-light text-grey-700">
        {value}
      </div>
    </div>
  );
}
