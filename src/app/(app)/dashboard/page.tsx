'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import type { Shipment } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = React.useState<Shipment[] | null>(null);

  React.useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const q = user.role === 'CUSTOMER' ? { customerId: user.id } : {};
    void api.shipments.list(q)
      .then((r) => { if (!cancelled) setShipments(r); })
      .catch(() => { if (!cancelled) setShipments([]); });
    return () => { cancelled = true; };
  }, [user]);

  const stats = React.useMemo(() => {
    const s = shipments ?? [];
    return {
      total: s.length,
      active: s.filter((x) => !['DELIVERED', 'CANCELLED'].includes(x.status)).length,
      delivered: s.filter((x) => x.status === 'DELIVERED').length,
      awaiting: s.filter((x) => x.status === 'CREATED').length,
    };
  }, [shipments]);

  const cards = [
    { label: 'Total', value: stats.total, icon: Package },
    { label: 'In progress', value: stats.active, icon: Truck },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle2 },
    { label: 'Awaiting pickup', value: stats.awaiting, icon: Clock },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Good to see you{user ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Here is where your shipments stand.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-2 p-5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
                <Icon className="size-3.5" />{label}
              </span>
              <span className="text-2xl font-semibold tabular-nums">
                {shipments === null ? '—' : value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Recent shipments</h2>
        <Button asChild variant="ghost" size="sm"><Link href="/shipments">View all</Link></Button>
      </div>

      {shipments === null ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-[var(--radius-card)] bg-ink-100 dark:bg-ink-800" />
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No shipments yet"
          description="Create your first shipment and it will appear here with live tracking."
          action={<Button asChild size="sm"><Link href="/shipments/new">Create shipment</Link></Button>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {shipments.slice(0, 5).map((s) => (
            <Link key={s.id} href={`/shipments/${s.id}`}
              className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-accent-500/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">{s.reference}</span>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                  {s.origin} → {s.destination}
                </p>
              </div>
              <time className="shrink-0 text-xs text-[var(--muted)]" dateTime={s.createdAt}>
                {new Date(s.createdAt).toLocaleDateString()}
              </time>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
