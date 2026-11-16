'use client';

import clsx from 'clsx';
import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

export interface UiDrawerProps {
  open: boolean;
  title: string;
  /** Centered above the title (e.g. a `UiStepper`); 328px wide. */
  stepper?: ReactNode;
  /** Pinned to the bottom of the drawer (action buttons). */
  footer?: ReactNode;
  /** Dismiss: Escape and backdrop click. */
  onClose: () => void;
  children?: ReactNode;
  className?: string;
}

export function UiDrawer({
  open,
  title,
  stepper,
  footer,
  onClose,
  children,
  className,
}: UiDrawerProps) {
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
      // Escape: keep `open` controlled by the parent instead of closing natively.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Clicks on the backdrop land on the <dialog> itself, not on its content.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={clsx(
        'my-0 mr-0 ml-auto h-dvh max-h-none w-130 max-w-full bg-white p-0 text-grey-700 backdrop:bg-backdrop backdrop:backdrop-blur-[2px]',
        className,
      )}
    >
      <div className="flex min-h-full flex-col pt-12.5 pr-13.25 pb-13 pl-11.75">
        {/* The side padding is asymmetric (47px / 53px, as in Figma), but the header is centered on the panel: shift it 3px. */}
        {stepper && (
          <div className="mx-auto w-82 max-w-full translate-x-0.75">
            {stepper}
          </div>
        )}
        <h2
          id={titleId}
          className={clsx(
            'translate-x-0.75 text-center text-h3 break-words text-grey-800',
            stepper && 'mt-6',
          )}
        >
          {title}
        </h2>
        <div className="mt-11.5">{children}</div>
        {footer && <div className="mt-auto pt-6">{footer}</div>}
      </div>
    </dialog>
  );
}
