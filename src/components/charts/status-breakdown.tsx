import { StatusBadge } from '@/components/status-badge';
import { SHIPMENT_STATUSES, type ShipmentStatus } from '@/lib/types';

/**
 * Count per stage as labelled bars in one hue: the badge carries identity,
 * the bar only magnitude - so nothing depends on telling six colours apart.
 */
export function StatusBreakdown({ byStatus }: { byStatus: Partial<Record<ShipmentStatus, number>> }) {
  const max = Math.max(1, ...SHIPMENT_STATUSES.map((s) => byStatus[s] ?? 0));
  return (
    <ul className="space-y-3">
      {SHIPMENT_STATUSES.map((s) => {
        const n = byStatus[s] ?? 0;
        return (
          <li key={s} className="grid grid-cols-[124px_1fr_32px] items-center gap-3" title={`${n} ${s.toLowerCase().replace(/_/g, ' ')}`}>
            <StatusBadge status={s} size="sm" className="justify-self-start" />
            <div className="h-2 overflow-hidden rounded-full bg-lavender">
              <div className="h-full rounded-full bg-linear-to-r from-brand to-brand-strong transition-[width] duration-700" style={{ width: `${(n / max) * 100}%` }} />
            </div>
            <span className="text-right text-sm font-semibold tabular-nums">{n}</span>
          </li>
        );
      })}
    </ul>
  );
}
