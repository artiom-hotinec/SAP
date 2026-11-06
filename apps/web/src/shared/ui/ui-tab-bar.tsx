'use client';

import clsx from 'clsx';
import { useState, type HTMLAttributes } from 'react';

export interface UiTabBarItem<T extends string = string> {
  value: T;
  label: string;
}

export interface UiTabBarProps<T extends string = string> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange'
> {
  tabs: UiTabBarItem<T>[];
  /** Controlled active tab. */
  value?: T;
  /** Initial active tab when uncontrolled. Defaults to the first tab. */
  defaultValue?: T;
  onValueChange?: (value: T) => void;
}

export function UiTabBar<T extends string = string>({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: UiTabBarProps<T>) {
  const [innerValue, setInnerValue] = useState<T | undefined>(
    defaultValue ?? tabs[0]?.value,
  );
  const current = value ?? innerValue;

  return (
    <div
      role="tablist"
      className={clsx('flex items-start gap-10', className)}
      {...props}
    >
      {tabs.map((tab) => {
        const active = tab.value === current;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              setInnerValue(tab.value);
              onValueChange?.(tab.value);
            }}
            className={clsx(
              'inline-grid cursor-pointer border-b-2 pb-1 text-body-lg whitespace-nowrap text-grey-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-brand',
              active ? 'border-red-brand font-bold' : 'border-transparent',
            )}
          >
            {/* Hidden bold copy reserves the bold width so the layout doesn't shift */}
            <span
              className="invisible col-start-1 row-start-1 font-bold"
              aria-hidden
            >
              {tab.label}
            </span>
            <span className="col-start-1 row-start-1">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
