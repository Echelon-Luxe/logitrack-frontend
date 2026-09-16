'use client';

import * as React from 'react';
import Link from 'next/link';
import { Truck, Power } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import type { Driver, Shipment } from '@/lib/types';

export default function DriverPage() {
  const { user } = useAuth();
  const [driver, setDriver] = React.useState<Driver | null>(null);
  const [jobs, setJobs] = React.useState<Shipment[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(async () => {
    if (!user) return null;
    const all = await api.drivers.list().catch(() => [] as Driver[]);
    const me = all.find((d) => d.userId === user.id) ?? null;
    const assigned = me
      ? await api.shipments.list({ driverId: me.id }).catch(() => [] as Shipment[])
      : [];
    return { me, assigned };
  }, [user]);

  React.useEffect(() => {
    let cancelled = false;
    void fetchAll().then((r) => {
      if (cancelled || !r) return;
      setDriver(r.me);
      setJobs(r.assigned);
    });
    return () => { cancelled = true; };
  }, [fetchAll]);

  async function toggle() {
    if (!driver) return;
    setBusy(true);
    setError(null);
    try {
      const next = driver.availability === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
      setDriver(await api.drivers.setAvailability(driver.id, next));
    } catch (err) {
      // 409 means they still hold a shipment; the server refuses rather than
      // stranding it, and its message names the shipment.
      setError(err instanceof ApiError ? err.message : 'Could not change availability.');
    } finally {
      setBusy(false);
    }
  }

  if (!driver) {
    return (
      <EmptyState
        icon={Truck}
        title="No driver profile"
        description="This account is not linked to a driver profile yet. An operations user can create one."
      />
    );
  }

  const active = jobs.filter((j) => !['DELIVERED', 'CANCELLED'].includes(j.status));

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Driver</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Your availability and assigned deliveries.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{driver.name}</CardTitle>
            <CardDescription>
              {driver.vehicleType}
              {' · '}
              <span className={driver.status === 'AVAILABLE' ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                {driver.status.replace('_', ' ').toLowerCase()}
              </span>
            </CardDescription>
          </div>
          <Button
            onClick={() => void toggle()}
            disabled={busy}
            variant={driver.availability === 'ONLINE' ? 'secondary' : 'primary'}
          >
            <Power className="size-4" />
            {driver.availability === 'ONLINE' ? 'Go offline' : 'Go online'}
          </Button>
        </CardHeader>
        {error && (
          <CardContent>
            <p role="alert" className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              {error}
            </p>
          </CardContent>
        )}
      </Card>

      <h2 className="text-base font-semibold tracking-tight">Active deliveries</h2>
      {active.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nothing assigned"
          description="When operations assigns you a shipment it will appear here."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((j) => (
            <Link
              key={j.id}
              href={`/shipments/${j.id}`}
              className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-accent-500/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium tabular-nums">{j.reference}</span>
                  <StatusBadge status={j.status} />
                </div>
                <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                  {j.origin} &rarr; {j.destination}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
