'use client';

import clsx from 'clsx';
import { useEffect, useId, useRef } from 'react';
import { UiButton } from './ui-button';

/** `single`: one primary button (e.g. "Close"). `confirm`: text "Cancel" + primary "Yes". */
export type UiModalVariant = 'single' | 'confirm';

export interface UiModalProps {
  open: boolean;
  title: string;
  variant?: UiModalVariant;
  /** Primary button label. Defaults to "Close" (`single`) / "Yes" (`confirm`). */
  confirmLabel?: string;
  /** Text button label (`confirm` only). Defaults to "Cancel". */
  cancelLabel?: string;
  /** Primary button in the `confirm` variant. */
  onConfirm?: () => void;
  /** Dismiss: Cancel button, Escape, backdrop click and the `single` button. */
  onClose: () => void;
  className?: string;
}

export function UiModal({
  open,
  title,
  variant = 'confirm',
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  className,
}: UiModalProps) {
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
        'm-auto w-81.5 max-w-[calc(100%-2rem)] rounded-md bg-white p-0 text-grey-700 shadow-[0px_8px_20px_0px_rgba(17,24,39,0.1)] backdrop:bg-grey-900/40',
        className,
      )}
    >
      <div className="px-6 pt-6 pb-6">
        <h2
          id={titleId}
          className="text-center text-h4 break-words text-grey-700"
        >
          {title}
        </h2>

        {variant === 'single' ? (
          <div className="mt-9.5 flex justify-center">
            <UiButton className="w-35" onClick={onClose}>
              {confirmLabel ?? 'Close'}
            </UiButton>
          </div>
        ) : (
          <div className="mt-9.5 flex items-center justify-center gap-10">
            <UiButton variant="cancel" onClick={onClose}>
              {cancelLabel}
            </UiButton>
            <UiButton className="w-31" onClick={onConfirm}>
              {confirmLabel ?? 'Yes'}
            </UiButton>
          </div>
        )}
      </div>
    </dialog>
  );
}
