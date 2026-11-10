import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

export interface UiStatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
}

export function UiStatCard({
  label,
  value,
  icon,
  loading = false,
  className,
  ...props
}: UiStatCardProps) {
  return (
    <div
      className={clsx(
        'relative h-21 w-56.25 rounded-lg border border-pink-100 bg-white px-4.75 pt-4.5',
        className,
      )}
      aria-busy={loading || undefined}
      {...props}
    >
      <p className="text-body-sm font-bold text-grey-700">{label}</p>
      {loading ? (
        <div
          className="mt-2.5 h-5 w-12 animate-pulse rounded bg-grey-200"
          aria-hidden="true"
        />
      ) : (
        <p className="mt-2 text-h4 text-grey-900">{value}</p>
      )}
      {icon ? (
        <span className="absolute top-3.75 right-3.75 flex size-6 items-start justify-start text-pink-100">
          {icon}
        </span>
      ) : null}
    </div>
  );
}
