import clsx from 'clsx';
import Image from 'next/image';
import type { HTMLAttributes } from 'react';

export type UiTableRowStatus = 'active' | 'inactive' | 'unregistered';

export interface UiTableRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Row state: active (check), inactive (grey, dash) or unregistered (plain text). */
  status?: UiTableRowStatus;
  name: string;
  phone: string;
  email: string;
  /** Last appointment date; falls back to `--`. */
  date?: string;
  /** Shows the unread-message icon at the end of the row. */
  hasMessage?: boolean;
}

const STATUS_LABEL: Record<UiTableRowStatus, string> = {
  active: 'Yes',
  inactive: 'No',
  unregistered: 'Unreg.',
};

export function UiTableRow({
  status = 'active',
  name,
  phone,
  email,
  date = '--',
  hasMessage = false,
  className,
  ...props
}: UiTableRowProps) {
  return (
    <div
      role="row"
      className={clsx(
        'relative grid h-16 w-full grid-cols-[95px_211px_182px_249px_1fr] items-center rounded-lg border border-grey-500 px-6 text-body-md whitespace-nowrap text-grey-800',
        status === 'inactive' ? 'bg-grey-200' : 'bg-white',
        className,
      )}
      {...props}
    >
      <span role="cell" className="flex items-center gap-2">
        {status === 'active' && (
          <Image
            src="/icons/check-outline.svg"
            alt=""
            width={24}
            height={24}
            className="shrink-0"
          />
        )}
        {status === 'inactive' && (
          <Image
            src="/icons/dash.svg"
            alt=""
            width={17}
            height={2}
            className="shrink-0"
          />
        )}
        {STATUS_LABEL[status]}
      </span>
      <span role="cell">{name}</span>
      <span role="cell">{phone}</span>
      <span role="cell">
        {status === 'unregistered' ? (
          email
        ) : (
          <a href={`mailto:${email}`}>{email}</a>
        )}
      </span>
      <span role="cell">{date}</span>
      {hasMessage && (
        <Image
          src="/icons/mail-outline.svg"
          alt="Unread message"
          width={24}
          height={24}
          className="absolute top-1/2 right-6 -translate-y-1/2"
        />
      )}
    </div>
  );
}
