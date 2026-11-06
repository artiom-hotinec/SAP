import clsx from 'clsx';
import Image from 'next/image';
import type { ButtonHTMLAttributes } from 'react';

export type UiAddButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function UiAddButton({
  type = 'button',
  className,
  'aria-label': ariaLabel = 'Add',
  ...props
}: UiAddButtonProps) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={clsx(
        'inline-flex size-10 cursor-pointer items-center justify-center rounded-lg bg-red-brand shadow-[0px_24px_32px_6px_rgba(82,82,152,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-brand disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <Image src="/icons/add-outline.svg" alt="" width={24} height={24} />
    </button>
  );
}
