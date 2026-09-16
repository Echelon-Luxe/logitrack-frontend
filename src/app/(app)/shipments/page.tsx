'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { SHIPMENT_STATUSES, STATUS_LABEL, type Shipment, type ShipmentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ShipmentsPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = React.useState<Shipment[] | null>(null);
  const [filter, setFilter] = React.useState<ShipmentStatus | 'ALL'>('ALL');

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const q: Parameters<typeof api.shipments.list>[0] =
      user.role === 'CUSTOMER' ? { customerId: user.id } : {};
    if (filter !== 'ALL') q.status = filter;
    // Guarding on `cancelled` also drops a slow response for a filter the user
    // has already moved on from.
    void api.shipments.list(q)
      .then((r) => { if (!cancelled) setShipments(r); })
      .catch(() => { if (!cancelled) setShipments([]); });
    return () => { cancelled = true; };
  }, [user, filter]);

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Every shipment you have access to.</p>
        </div>
        <Button asChild><Link href="/shipments/new"><Plus className="size-4" />New shipment</Link></Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(['ALL', ...SHIPMENT_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            aria-pressed={filter === s}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              filter === s
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'bg-ink-100 text-[var(--muted)] hover:text-[var(--text)] dark:bg-ink-800',
            )}
          >
            {s === 'ALL' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {shipments === null ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[var(--radius-card)] bg-ink-100 dark:bg-ink-800" />
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={Package}
          title={filter === 'ALL' ? 'No shipments yet' : `Nothing ${STATUS_LABEL[filter].toLowerCase()}`}
          description={filter === 'ALL'
            ? 'Create your first shipment to get started.'
            : 'Try a different filter, or create a new shipment.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="bg-ink-100/60 text-left text-xs text-[var(--muted)] dark:bg-ink-800/60">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Reference</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Route</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id}
                  className="border-t border-[var(--border)] bg-[var(--surface)] transition-colors hover:bg-ink-50 dark:hover:bg-ink-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/shipments/${s.id}`}
                      className="font-medium tabular-nums text-accent-600 hover:underline dark:text-accent-400">
                      {s.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{s.origin} → {s.destination}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-[var(--muted)] tabular-nums">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
