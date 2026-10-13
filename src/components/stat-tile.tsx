import type { ElementType } from 'react';
import { cn } from '@/lib/utils';

// Each tone is a soft tile tint with a solid icon chip, after the feature
// cards on talkpadi.com.
const TONES = {
  brand: { tile: 'bg-lavender', chip: 'bg-brand text-white' },
  violet: { tile: 'bg-brand-200/50', chip: 'bg-brand-strong text-white' },
  amber: { tile: 'bg-cream', chip: 'bg-orange text-white' },
  green: { tile: 'bg-mint', chip: 'bg-teal text-white' },
  teal: { tile: 'bg-mint', chip: 'bg-teal text-white' },
} as const;

export const StatTile = ({ label, value, hint, icon: Icon, tone = 'brand', className }: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ElementType;
  tone?: keyof typeof TONES;
  className?: string;
}) => (
  <div className={cn('rounded-3xl p-5', TONES[tone].tile, className)}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-fg/70">{label}</p>
      <span className={cn('grid size-9 place-items-center rounded-2xl', TONES[tone].chip)}>
        <Icon className="size-4" />
      </span>
    </div>
    <p className="mt-4 font-display text-[34px] leading-none font-extrabold tracking-tight tabular-nums">{value}</p>
    {hint ? <p className="mt-2 text-xs text-fg/60">{hint}</p> : null}
  </div>
);
