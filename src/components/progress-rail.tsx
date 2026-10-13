import { Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATUS_PROGRESS } from '@/lib/geo';
import type { ShipmentStatus } from '@/lib/types';

/**
 * Origin dot, travelled line, truck, remaining dashes, destination dot.
 * Position comes from live progress when known, otherwise from the status.
 */
export function ProgressRail({ status, progress, className }: { status: ShipmentStatus; progress?: number | null; className?: string }) {
  const done = status === 'DELIVERED';
  const cancelled = status === 'CANCELLED';
  const p = Math.min(1, Math.max(0, progress ?? STATUS_PROGRESS[status] ?? 0));
  const pct = `${(p * 100).toFixed(1)}%`;
  const started = p > 0.05;

  return (
    <div className={cn('relative flex h-6 items-center', className)} aria-hidden>
      <span className={cn('relative z-10 size-3 shrink-0 rounded-full ring-4', started || done ? 'bg-emerald-500 ring-emerald-500/15' : 'bg-faint ring-surface-3')} />
      <div className="relative mx-1 h-6 flex-1">
        {/* remaining: dashed */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-line-strong" />
        {/* travelled: solid */}
        <div
          className={cn('absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-full transition-[width] duration-700', cancelled ? 'bg-rose-400/60' : 'bg-emerald-500')}
          style={{ width: pct }}
        />
        {!done && !cancelled ? (
          <span
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700"
            style={{ left: `clamp(10px, ${pct}, calc(100% - 10px))` }}
          >
            <span className="grid size-6 place-items-center rounded-md bg-surface text-fg shadow-[var(--shadow-card)] ring-1 ring-line">
              <Truck className="size-3.5" />
            </span>
          </span>
        ) : null}
      </div>
      <span className={cn('relative z-10 size-3 shrink-0 rounded-full ring-4', done ? 'bg-emerald-500 ring-emerald-500/15' : cancelled ? 'bg-rose-400 ring-rose-400/15' : 'bg-ink-600 ring-surface-3')} />
    </div>
  );
}
