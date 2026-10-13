import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const EmptyState = ({ icon: Icon, title, description, action, className }: {
  icon: ElementType; title: string; description: string; action?: ReactNode; className?: string;
}) => (
  <div className={cn('flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface-2 px-6 py-12 text-center', className)}>
    <span className="grid size-12 place-items-center rounded-2xl bg-lavender text-brand">
      <Icon className="size-5" />
    </span>
    <div>
      <p className="font-display text-lg font-extrabold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
    </div>
    {action}
  </div>
);
