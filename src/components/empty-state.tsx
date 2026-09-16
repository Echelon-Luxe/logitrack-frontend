import type { ElementType, ReactNode } from 'react';

export const EmptyState = ({ icon: Icon, title, description, action }: {
  icon: ElementType; title: string; description: string; action?: ReactNode;
}) => (
  <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--border)] px-6 py-14 text-center">
    <span className="grid size-10 place-items-center rounded-xl bg-ink-100 text-[var(--muted)] dark:bg-ink-800">
      <Icon className="size-5" />
    </span>
    <div>
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">{description}</p>
    </div>
    {action}
  </div>
);
