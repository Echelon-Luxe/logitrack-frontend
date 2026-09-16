'use client';

import * as React from 'react';
import Link from 'next/link';
import { Shield, Package } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import type { Driver, Shipment } from '@/lib/types';

export default function AdminPage() {
  const [shipments, setShipments] = React.useState<Shipment[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Fetching and state-setting are separate so the effect never calls setState
  // synchronously, and a response that arrives after unmount is discarded.
  const fetchAll = React.useCallback(async () => {
    const [s, d] = await Promise.all([
      api.shipments.list().catch(() => [] as Shipment[]),
      api.drivers.list().catch(() => [] as Driver[]),
    ]);
    return { s, d };
  }, []);

  const load = React.useCallback(async () => {
    const { s, d } = await fetchAll();
    setShipments(s);
    setDrivers(d);
  }, [fetchAll]);

  React.useEffect(() => {
    let cancelled = false;
    void fetchAll().then(({ s, d }) => {
      if (cancelled) return;
      setShipments(s);
      setDrivers(d);
    });
    return () => { cancelled = true; };
  }, [fetchAll]);

  async function assign(shipmentId: string, driverId: string) {
    setBusy(shipmentId);
    setError(null);
    try {
      await api.shipments.assign(shipmentId, driverId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not assign the driver.');
    } finally {
      setBusy(null);
    }
  }

  const unassigned = shipments.filter((s) => !s.driverId && s.status === 'CREATED');
  const available = drivers.filter((d) => d.status === 'AVAILABLE');

  const fleetTone = (status: Driver['status']) =>
    status === 'AVAILABLE'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
      : status === 'ON_JOB'
        ? 'bg-accent-500/12 text-accent-600 dark:text-accent-400'
        : 'bg-ink-200 text-ink-600 dark:bg-ink-800 dark:text-ink-400';

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="flex items-center gap-2">
        <Shield className="size-5 text-[var(--muted)]" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Assign drivers and oversee the fleet.</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Awaiting a driver</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {unassigned.length === 0 ? (
              <p className="py-4 text-sm text-[var(--muted)]">Every created shipment has a driver.</p>
            ) : (
              unassigned.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] p-3"
                >
                  <Link href={`/shipments/${s.id}`} className="font-medium tabular-nums hover:underline">
                    {s.reference}
                  </Link>
                  <StatusBadge status={s.status} />
                  <span className="w-full truncate text-xs text-[var(--muted)] sm:w-auto">
                    {s.origin} &rarr; {s.destination}
                  </span>
                  <select
                    aria-label={`Assign a driver to ${s.reference}`}
                    disabled={busy === s.id || available.length === 0}
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) void assign(s.id, e.target.value); }}
                    className="ml-auto h-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs"
                  >
                    <option value="" disabled>
                      {available.length === 0 ? 'No drivers available' : 'Assign driver'}
                    </option>
                    {available.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} &middot; {d.vehicleType}</option>
                    ))}
                  </select>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fleet</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {drivers.length === 0 ? (
              <p className="py-4 text-sm text-[var(--muted)]">No drivers registered.</p>
            ) : (
              drivers.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{d.name}</p>
                    <p className="text-xs text-[var(--muted)]">{d.vehicleType}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${fleetTone(d.status)}`}>
                    {d.status.replace('_', ' ').toLowerCase()}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-base font-semibold tracking-tight">All shipments</h2>
      {shipments.length === 0 ? (
        <EmptyState icon={Package} title="No shipments" description="Nothing has been created yet." />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)]">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-ink-100/60 text-left text-xs text-[var(--muted)] dark:bg-ink-800/60">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Reference</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Driver</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-t border-[var(--border)] bg-[var(--surface)]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/shipments/${s.id}`}
                      className="font-medium tabular-nums text-accent-600 hover:underline dark:text-accent-400"
                    >
                      {s.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {drivers.find((d) => d.id === s.driverId)?.name ?? '—'}
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
