'use client';

import clsx from 'clsx';
import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

export interface UiFormModalProps {
  open: boolean;
  title: string;
  /** Centered above the title (e.g. a `UiStepper`). */
  stepper?: ReactNode;
  /** Pinned under the content (action buttons). */
  footer?: ReactNode;
  /** Dismiss: Escape and backdrop click. */
  onClose: () => void;
  children?: ReactNode;
  className?: string;
}

/** A centered native `<dialog>` for multi-step forms; same slots as `UiDrawer`. */
export function UiFormModal({
  open,
  title,
  stepper,
  footer,
  onClose,
  children,
  className,
}: UiFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Clicks on the backdrop land on the <dialog> itself, not on its content.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={clsx(
        'm-auto max-h-[calc(100dvh-2rem)] w-150 max-w-[calc(100%-2rem)] overflow-y-auto rounded-md bg-white p-0 text-grey-700 shadow-[0px_8px_20px_0px_rgba(17,24,39,0.1)] backdrop:bg-backdrop backdrop:backdrop-blur-[2px]',
        className,
      )}
    >
      <div className="flex min-h-full flex-col px-12 py-10">
        {stepper && <div className="mx-auto w-82 max-w-full">{stepper}</div>}
        <h2
          id={titleId}
          className={clsx(
            'text-center text-h3 break-words text-grey-800',
            stepper && 'mt-6',
          )}
        >
          {title}
        </h2>
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-auto pt-6">{footer}</div>}
      </div>
    </dialog>
  );
}
