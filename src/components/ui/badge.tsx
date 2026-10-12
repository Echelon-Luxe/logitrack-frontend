import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badge = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium',
  {
    variants: {
      tone: {
        neutral: 'border-line bg-surface-3 text-muted',
        brand: 'border-brand/20 bg-brand-soft text-brand',
        amber: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
        sky: 'border-sky-500/25 bg-sky-500/10 text-sky-700',
        violet: 'border-violet-500/25 bg-violet-500/10 text-violet-700',
        teal: 'border-teal-500/25 bg-teal-500/10 text-teal-700',
        green: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
        rose: 'border-rose-500/25 bg-rose-500/10 text-rose-700',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        md: 'px-2.5 py-1 text-xs',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badge>['tone']>;

export const Badge = ({ className, tone, size, dot, children, ...props }:
  React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge> & { dot?: boolean }) => (
  <span className={cn(badge({ tone, size }), className)} {...props}>
    {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
    {children}
  </span>
);
