'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

export type UiDropdownSize = 'md' | 'sm' | 'xs';

export interface UiDropdownOption {
  value: string;
  label: string;
}

export interface UiDropdownProps {
  options: UiDropdownOption[];
  /** Selected value (controlled). Omit to let the dropdown manage its own state. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  /** Label shown above the trigger. */
  label?: string;
  size?: UiDropdownSize;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  className?: string;
}

const sizeClasses: Record<
  UiDropdownSize,
  { trigger: string; value: string; item: string; icon: string }
> = {
  md: {
    trigger: 'h-14 rounded-xl py-4 pr-2 pl-4 text-body-lg font-light',
    value: 'text-grey-700',
    item: 'text-body-lg',
    icon: 'size-6',
  },
  sm: {
    trigger: 'h-13 rounded-lg py-4 pr-2 pl-4 text-body-md',
    value: 'text-grey-700',
    item: 'text-body-md',
    icon: 'size-6',
  },
  xs: {
    trigger: 'h-9.25 rounded-lg py-1.75 pr-1.5 pl-2.5 text-body-sm',
    value: 'text-grey-800',
    item: 'text-body-sm',
    icon: 'size-5.75',
  },
};

export function UiDropdown({
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  label,
  size = 'md',
  disabled,
  id,
  'aria-label': ariaLabel,
  className,
}: UiDropdownProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listId = `${triggerId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);

  const [innerValue, setInnerValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const currentValue = value ?? innerValue;
  const selected = options.find((option) => option.value === currentValue);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const openList = () => {
    setActiveIndex(
      Math.max(
        options.findIndex((option) => option.value === currentValue),
        0,
      ),
    );
    setOpen(true);
  };

  const select = (option: UiDropdownOption) => {
    setInnerValue(option.value);
    onChange?.(option.value);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!open) return openList();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setActiveIndex(
          (index) => (index + step + options.length) % options.length,
        );
        break;
      }
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!open) return openList();
        if (options[activeIndex]) select(options[activeIndex]);
        break;
      case 'Escape':
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={rootRef} className={clsx('relative w-full', className)}>
      {label && (
        <label
          htmlFor={triggerId}
          className="mb-1 block text-body-sm font-light text-grey-500"
        >
          {label}
        </label>
      )}
      <button
        id={triggerId}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-activedescendant={
          open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={clsx(
          'flex w-full cursor-pointer items-center gap-2 border border-grey-700 bg-white-high text-left outline-none focus-visible:border-blue-200 disabled:cursor-not-allowed disabled:opacity-50',
          sizeClasses[size].trigger,
        )}
      >
        <span
          className={clsx(
            'min-w-0 flex-1 truncate',
            selected ? sizeClasses[size].value : 'text-grey-600',
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <Image
          src="/icons/chevron-down.svg"
          alt=""
          width={24}
          height={24}
          className={clsx(
            'shrink-0',
            sizeClasses[size].icon,
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-lg border border-grey-500 bg-white"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={option.value === currentValue}
              onClick={() => select(option)}
              onPointerEnter={() => setActiveIndex(index)}
              className={clsx(
                'cursor-pointer px-4 py-2 leading-5.5',
                sizeClasses[size].item,
                index === activeIndex
                  ? 'bg-blue-300 text-white'
                  : 'text-grey-700',
              )}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
