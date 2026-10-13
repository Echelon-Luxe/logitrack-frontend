import type { ElementType } from 'react';
import { cn } from '@/lib/utils';

export const StatTile = ({ label, value, hint, icon: Icon, tone = 'brand', className }: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ElementType;
  tone?: 'brand' | 'amber' | 'violet' | 'green' | 'teal';
  className?: string;
}) => (
  <div className={cn('rounded-xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]', className)}>
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted">{label}</p>
      <Icon className="size-4 text-faint" data-tone={tone} />
    </div>
    <p className="mt-3 text-[28px] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
    {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
  </div>
);
