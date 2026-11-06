import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

export type UiButtonVariant = 'primary' | 'link' | 'cancel';

export interface UiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: UiButtonVariant;
}

const baseClasses =
  'inline-flex cursor-pointer items-center justify-center text-center text-body-lg font-bold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const variantClasses: Record<UiButtonVariant, string> = {
  primary:
    'rounded-xl bg-red-brand p-4 text-white drop-shadow-[0px_10px_12.5px_rgba(17,24,39,0.1)] focus-visible:outline-red-brand',
  link: 'text-blue-300 focus-visible:outline-blue-300',
  cancel: 'text-red-brand focus-visible:outline-red-brand',
};

export function UiButton({
  variant = 'primary',
  type = 'button',
  className,
  children,
  ...props
}: UiButtonProps) {
  return (
    <button
      type={type}
      className={clsx(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
