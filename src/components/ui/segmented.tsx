'use client';

import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

// Pill-style tabs for filters. Radio semantics: exactly one is selected.
export function Segmented<T extends string>({ options, value, onChange, className, size = 'md' }: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div role="radiogroup" className={cn('scroll-thin flex gap-1 overflow-x-auto rounded-lg border border-line bg-surface-2 p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-all',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'bg-surface text-fg shadow-[var(--shadow-card)] ring-1 ring-line' : 'text-muted hover:text-fg',
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <span className={cn('rounded-md px-1.5 text-[11px] tabular-nums', active ? 'text-muted' : 'text-faint')}>
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
