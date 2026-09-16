import { cn } from '@/lib/utils';
import { STATUS_LABEL, type ShipmentStatus } from '@/lib/types';

// Green reads as "done", red as "wrong", blue as "in motion". Cancelled is
// deliberately grey, not red: it is a valid outcome, not a failure.
const TONE: Record<ShipmentStatus, string> = {
  CREATED:          'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200',
  PICKED_UP:        'bg-accent-500/12 text-accent-600 dark:text-accent-400',
  IN_TRANSIT:       'bg-accent-500/12 text-accent-600 dark:text-accent-400',
  OUT_FOR_DELIVERY: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  DELIVERED:        'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  CANCELLED:        'bg-ink-200 text-ink-600 dark:bg-ink-800 dark:text-ink-400 line-through',
};

export const StatusBadge = ({ status, className }: { status: ShipmentStatus; className?: string }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      TONE[status], className,
    )}
  >
    {STATUS_LABEL[status] ?? status}
  </span>
);
