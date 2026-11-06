import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

interface UiStepperProps extends ComponentPropsWithoutRef<'ol'> {
  /** Total number of steps. */
  steps: number;
  /** Current step, 1-based. Earlier steps are shown as completed. */
  current: number;
}

export function UiStepper({
  steps,
  current,
  className,
  ...props
}: UiStepperProps) {
  return (
    <ol
      className={clsx(
        'relative flex w-full items-center justify-between',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 bg-red-50"
      />
      {Array.from({ length: steps }, (_, i) => {
        const step = i + 1;
        const isCurrent = step === current;
        const isDone = step < current;

        return (
          <li
            key={step}
            aria-current={isCurrent ? 'step' : undefined}
            className={clsx(
              'relative flex size-6 items-center justify-center rounded-full text-body-sm font-bold',
              isCurrent && 'border border-red-brand bg-red-brand text-white',
              isDone && 'border-2 border-red-brand bg-white text-red-brand',
              !isCurrent &&
                !isDone &&
                'border border-grey-500 bg-white text-grey-500',
            )}
          >
            {step}
          </li>
        );
      })}
    </ol>
  );
}
