import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

export interface UiCheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  label: string;
}

export function UiCheckbox({ label, className, ...props }: UiCheckboxProps) {
  return (
    <label
      className={clsx(
        'flex cursor-pointer items-center gap-3 text-body-lg text-grey-800',
        className,
      )}
    >
      <input type="checkbox" className="size-5 accent-blue-600" {...props} />
      {label}
    </label>
  );
}
