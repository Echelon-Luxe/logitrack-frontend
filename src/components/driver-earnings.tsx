'use client';

import * as React from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/empty-state';
import { EARNING_LABEL, formatKobo, type DriverEarnings } from '@/lib/types';

const TONE: Record<string, string> = {
  PENDING: 'text-amber-700 dark:text-amber-400',
  PAID: 'text-emerald-600 dark:text-emerald-400',
  VOID: 'text-[var(--muted)] line-through',
};

export function DriverEarningsCard({ driverId }: { driverId: string }) {
  const [data, setData] = React.useState<DriverEarnings | null>(null);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void api.earnings
      .forDriver(driverId)
      .then((d) => { if (!cancelled) setData(d); })
      // Earnings are secondary: a failure here must not take the jobs list with
      // it, so it degrades to a message rather than throwing to the page.
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [driverId]);

  const currency = data?.currency ?? 'NGN';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-4" aria-hidden />
          Earnings
        </CardTitle>
        <CardDescription>
          Accrued when you pick a shipment up, paid out once it is delivered.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {failed && (
          <p className="text-sm text-[var(--muted)]">Earnings are unavailable right now.</p>
        )}

        {!failed && !data && (
          <p className="text-sm text-[var(--muted)]">Loading…</p>
        )}

        {data && (
          <>
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-card)] border border-[var(--border)] p-3">
                <dt className="text-xs text-[var(--muted)]">Awaiting delivery</dt>
                <dd className="text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                  {formatKobo(data.totals.pending, currency)}
                </dd>
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--border)] p-3">
                <dt className="text-xs text-[var(--muted)]">Paid out</dt>
                <dd className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatKobo(data.totals.paid, currency)}
                </dd>
              </div>
            </dl>

            {data.earnings.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No earnings yet"
                description="Pick up a shipment and it will appear here."
              />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {data.earnings.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <Link
                        href={`/shipments/${e.shipmentId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {e.shipmentId.slice(0, 8)}
                      </Link>
                      <p className="text-xs text-[var(--muted)]">
                        {EARNING_LABEL[e.status]}
                        {e.paidAt ? ` · ${new Date(e.paidAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${TONE[e.status] ?? ''}`}>
                      {formatKobo(e.amount, e.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
