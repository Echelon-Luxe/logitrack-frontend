'use client';

import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { useMyEarnings } from '@/hooks/queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EARNING_LABEL, formatKobo } from '@/lib/types';
import { formatDate } from '@/lib/format';

export function DriverEarningsCard() {
  const { data, isError, isLoading } = useMyEarnings();
  const currency = data?.currency ?? 'NGN';

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2"><Wallet className="size-4 text-muted" />Earnings</CardTitle>
          <CardDescription>Accrued at pickup, paid once delivered.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Earnings are secondary: a failure degrades to a message, never takes the page down. */}
        {isError ? <p className="text-sm text-muted">Earnings are unavailable right now.</p> : null}
        {isLoading ? <Skeleton className="h-24" /> : null}
        {data ? (
          <>
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-amber-500/10 p-3">
                <dt className="text-xs font-medium text-amber-700">Awaiting delivery</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{formatKobo(data.totals.pending, currency)}</dd>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <dt className="text-xs font-medium text-emerald-700">Paid out</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">{formatKobo(data.totals.paid, currency)}</dd>
              </div>
            </dl>
            {data.earnings.length === 0 ? (
              <p className="text-sm text-muted">Pick up a shipment and your first earning appears here.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.earnings.slice(0, 8).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link href={`/shipments/${e.shipmentId}`} className="text-sm font-medium hover:text-brand">Job {e.shipmentId.slice(0, 8)}</Link>
                      <p className="text-xs text-muted">{formatDate(e.paidAt ?? e.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge size="sm" tone={e.status === 'PAID' ? 'green' : e.status === 'PENDING' ? 'amber' : 'neutral'}>{EARNING_LABEL[e.status]}</Badge>
                      <span className="text-sm font-semibold tabular-nums">{formatKobo(e.amount, e.currency)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
