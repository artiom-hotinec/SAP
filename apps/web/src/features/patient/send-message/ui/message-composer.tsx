'use client';

import clsx from 'clsx';
import { MAX_MESSAGE_LENGTH } from '@/entities/patient-message';
import { UiButton } from '@/shared/ui/ui-button';
import { useSendMessage } from '../model/use-send-message';

export interface MessageComposerProps {
  patientId: string;
}

/** Textarea + Send button for a new patient message, with validation and error display. */
export function MessageComposer({ patientId }: MessageComposerProps) {
  const { body, error, isPending, onChange, submit } =
    useSendMessage(patientId);
  const errorId = `message-error-${patientId}`;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2"
    >
      <textarea
        aria-label="Message"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        rows={3}
        value={body}
        readOnly={isPending}
        placeholder="Write a message"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        className={clsx(
          'w-full resize-none rounded-xl border bg-transparent p-4 text-body-lg text-grey-800 outline-none placeholder:font-light placeholder:text-grey-600',
          error ? 'border-red-400' : 'border-grey-500 focus:border-blue-200',
        )}
      />
      <div className="flex items-start justify-between gap-4">
        <p
          id={errorId}
          role={error ? 'alert' : undefined}
          className="text-body-sm text-red-400"
        >
          {error}
        </p>
        <div className="flex shrink-0 items-center gap-4">
          <span
            className={clsx(
              'text-body-sm',
              body.length > MAX_MESSAGE_LENGTH
                ? 'text-red-400'
                : 'text-grey-600',
            )}
          >
            {body.length}/{MAX_MESSAGE_LENGTH}
          </span>
          <UiButton
            type="submit"
            disabled={isPending}
            aria-busy={isPending || undefined}
            className="px-8 py-3"
          >
            Send
          </UiButton>
        </div>
      </div>
    </form>
  );
}
