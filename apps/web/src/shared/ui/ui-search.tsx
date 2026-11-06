'use client';

import clsx from 'clsx';
import { useId, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes } from 'react';

export interface UiSearchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'type'
  | 'size'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'onSelect'
  | 'onSearch'
  | 'results'
> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Progressive results shown under the input while it has a value. */
  results?: string[];
  onSelectResult?: (result: string) => void;
  /** Called when the search button is pressed or Enter is hit. */
  onSearch?: (value: string) => void;
  /** Class names for the outer wrapper (the native input gets the rest of the props). */
  className?: string;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={clsx('fill-current', className)}
      aria-hidden="true"
    >
      <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l4.25 4.25a1 1 0 0 0 1.49-1.49L15.5 14Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 18 18"
      className="size-4.5 fill-none stroke-current"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15.75 3.75-12 12m0-12 12 12" />
    </svg>
  );
}

export function UiSearch({
  value,
  defaultValue = '',
  onValueChange,
  results = [],
  onSelectResult,
  onSearch,
  placeholder = 'Search for patient',
  disabled,
  className,
  id,
  onKeyDown,
  ...props
}: UiSearchProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-results`;
  const [innerValue, setInnerValue] = useState(defaultValue);
  const [dismissed, setDismissed] = useState(false);

  const currentValue = value ?? innerValue;
  const isActive = currentValue.length > 0;
  const showResults = isActive && !dismissed && results.length > 0;

  const update = (next: string) => {
    setInnerValue(next);
    onValueChange?.(next);
  };

  return (
    <div
      className={clsx('relative w-full', className)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setDismissed(true);
        }
      }}
    >
      <div
        className={clsx(
          'flex h-10 w-full items-center overflow-hidden rounded-lg border',
          disabled && 'opacity-50',
          isActive
            ? 'border-blue-300 bg-white-medium'
            : 'border-grey-500 bg-white-high',
        )}
      >
        {isActive ? (
          <button
            type="button"
            aria-label="Search"
            disabled={disabled}
            onClick={() => onSearch?.(currentValue)}
            className="-m-px flex size-10 shrink-0 items-center justify-center bg-blue-300 text-white focus-visible:outline-2 focus-visible:outline-blue-200 disabled:cursor-not-allowed"
          >
            <SearchIcon className="size-6" />
          </button>
        ) : (
          <SearchIcon className="ml-2.5 size-6 shrink-0 text-grey-600" />
        )}
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={showResults}
          aria-controls={showResults ? listId : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          disabled={disabled}
          value={currentValue}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setDismissed(false);
            update(event.target.value);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.key === 'Enter') onSearch?.(currentValue);
            if (event.key === 'Escape') setDismissed(true);
          }}
          className={clsx(
            'h-full min-w-0 flex-1 bg-transparent px-3 text-body-md font-bold outline-none placeholder:text-grey-600 disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:hidden',
            isActive ? 'text-blue-300' : 'text-grey-800',
            !isActive && 'pl-2',
          )}
          {...props}
        />
        {isActive && (
          <button
            type="button"
            aria-label="Clear search"
            disabled={disabled}
            onClick={() => update('')}
            className="cursor-pointer mr-3 flex shrink-0 text-grey-700 focus-visible:outline-2 focus-visible:outline-blue-200 disabled:cursor-not-allowed"
          >
            <CloseIcon />
          </button>
        )}
      </div>
      {showResults && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-lg border border-blue-300 bg-white"
        >
          {results.map((result) => (
            <li key={result} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => {
                  update(result);
                  setDismissed(true);
                  onSelectResult?.(result);
                }}
                className="block w-full px-3.75 py-2 text-left text-body-md leading-5.5 text-grey-700 hover:bg-grey-200 focus-visible:bg-grey-200 focus-visible:outline-none"
              >
                {result}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
