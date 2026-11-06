'use client';

import clsx from 'clsx';
import { useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

export type UiInputType = 'text' | 'email' | 'password';

export type UiInputSize = 'md' | 'sm';

export interface UiInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  type?: UiInputType;
  size?: UiInputSize;
  label?: string;
  /** Error message shown under the input; also marks the input as invalid. */
  error?: string;
  /** Class names for the outer wrapper (the native input gets the rest of the props). */
  className?: string;
}

const inputBaseClasses =
  'w-full border bg-transparent text-grey-800 outline-none placeholder:font-light placeholder:text-grey-600 disabled:cursor-not-allowed disabled:opacity-50';

const sizeClasses: Record<
  UiInputSize,
  { label: string; input: string; password: string; toggle: string }
> = {
  md: {
    label: 'text-body-md leading-5.5',
    input: 'rounded-xl p-4 text-body-lg',
    password: 'pr-11',
    toggle: 'right-4',
  },
  sm: {
    label: 'mb-1 text-body-sm font-light',
    input: 'rounded-lg p-2.5 text-body-sm',
    password: 'pr-9.5',
    toggle: 'right-2.5',
  },
};

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 14.6658"
      className="h-auto w-5 fill-current"
      aria-hidden="true"
    >
      {visible ? (
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 .44C3.39.44.07 7.03.07 7.03a.67.67 0 0 0 0 .6S3.39 14.22 10 14.22s9.93-6.59 9.93-6.59a.67.67 0 0 0 0-.6S16.61.44 10 .44Zm0 1.33c5.03 0 7.89 4.36 8.57 5.56-.68 1.2-3.54 5.56-8.57 5.56S2.11 8.53 1.43 7.33C2.11 6.13 4.97 1.77 10 1.77ZM10 3.33a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 1.33a2.67 2.67 0 1 1 0 5.34 2.67 2.67 0 0 1 0-5.34Z"
        />
      ) : (
        <>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18.5734 7.33441C18.2274 6.73902 17.3341 5.34974 15.8967 4.10509C15.6188 3.86373 15.5887 3.44243 15.8295 3.16449C16.0701 2.88651 16.4915 2.85586 16.7701 3.09723C18.8787 4.92328 19.9295 7.03512 19.9295 7.03512C20.0235 7.22247 20.0235 7.44376 19.9295 7.63111C19.9295 7.63111 16.6109 14.2216 10.0004 14.2216C8.6764 14.2216 7.48311 13.9595 6.42106 13.5382C6.0791 13.4029 5.91169 13.0149 6.0471 12.6729C6.18311 12.3309 6.57045 12.1635 6.91316 12.2989C7.82923 12.6623 8.85779 12.8882 10.0005 12.8882C15.0344 12.8882 17.8866 8.52976 18.5738 7.33434L18.5734 7.33441ZM12.5448 6.53308C12.6241 6.78576 12.6668 7.05438 12.6668 7.33308C12.6668 8.80511 11.4722 9.99973 10.0002 9.99973C9.72148 9.99973 9.45288 9.95703 9.2002 9.87771C8.84961 9.767 8.47491 9.96239 8.3642 10.3137C8.25349 10.6643 8.44888 11.039 8.8002 11.1497C9.17892 11.2683 9.58218 11.333 10.0002 11.333C12.2075 11.333 14.0002 9.54032 14.0002 7.33306C14.0002 6.91504 13.9354 6.51176 13.8168 6.13306C13.7061 5.78172 13.3316 5.58632 12.9808 5.69706C12.6295 5.80778 12.4341 6.18232 12.5448 6.53306L12.5448 6.53308Z"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.7239 1.66625L16.1951 0.194976C16.4551 -0.0649921 16.8779 -0.0649921 17.1378 0.194976C17.3978 0.454945 17.3978 0.877716 17.1378 1.13768L15.3118 2.96373C15.3072 2.96908 15.3018 2.97444 15.2965 2.97905L5.6447 12.6308C5.64008 12.6362 5.63473 12.6415 5.62937 12.6461L3.80469 14.4708C3.54472 14.7308 3.12195 14.7308 2.86199 14.4708C2.60203 14.2109 2.60202 13.7881 2.86199 13.5281L4.11928 12.2708C1.41868 10.3329 0.0705368 7.63086 0.0705368 7.63086C-0.0235123 7.4435 -0.0235123 7.22221 0.0705368 7.03486C0.0705368 7.03486 3.38911 0.444411 9.99964 0.444411C11.8236 0.444411 13.399 0.941742 14.7234 1.66642L14.7239 1.66625ZM13.7352 2.65493C12.6645 2.12754 11.4199 1.77756 9.99993 1.77756C4.96528 1.77756 2.11349 6.13678 1.42663 7.33144C1.84389 8.05212 3.06129 9.9341 5.07603 11.3143L6.74002 9.65029C6.27396 8.99627 5.99998 8.19627 5.99998 7.33304C5.99998 5.12577 7.7927 3.33306 9.99997 3.33306C10.8634 3.33306 11.6634 3.60701 12.3172 4.07309L13.7352 2.65508L13.7352 2.65493ZM11.3538 5.03556C10.9571 4.80089 10.4938 4.66622 9.99978 4.66622C8.52774 4.66622 7.33312 5.86084 7.33312 7.33288C7.33312 7.82693 7.46779 8.29017 7.70246 8.68689L11.3538 5.03556Z"
          />
        </>
      )}
    </svg>
  );
}

export function UiInput({
  type = 'text',
  size = 'md',
  label,
  error,
  className,
  id,
  placeholder = ' ',
  'aria-invalid': ariaInvalid,
  ...props
}: UiInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isPassword = type === 'password';
  const errorId = `${inputId}-error`;
  const hasError =
    Boolean(error) || ariaInvalid === true || ariaInvalid === 'true';

  return (
    <div className={clsx('flex w-full flex-col', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className={clsx('text-grey-500', sizeClasses[size].label)}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && passwordVisible ? 'text' : type}
          placeholder={placeholder}
          aria-invalid={hasError || ariaInvalid}
          aria-describedby={error ? errorId : props['aria-describedby']}
          className={clsx(
            inputBaseClasses,
            sizeClasses[size].input,
            isPassword && sizeClasses[size].password,
            hasError
              ? 'border-red-400'
              : 'border-grey-500 focus:border-blue-200 not-focus:not-placeholder-shown:border-grey-700',
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={passwordVisible}
            disabled={props.disabled}
            onClick={() => setPasswordVisible((visible) => !visible)}
            className={clsx(
              'absolute top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-grey-600 focus-visible:outline-2 focus-visible:outline-blue-200 disabled:cursor-not-allowed',
              sizeClasses[size].toggle,
            )}
          >
            <EyeIcon visible={passwordVisible} />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-body-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
