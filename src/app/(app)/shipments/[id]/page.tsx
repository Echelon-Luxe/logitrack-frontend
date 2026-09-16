'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Clock } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { nextStatuses, isTerminal, STATUS_LABEL, type Shipment, type TrackingEvent } from '@/lib/types';

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [shipment, setShipment] = React.useState<Shipment | null>(null);
  const [events, setEvents] = React.useState<TrackingEvent[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(async () => {
    const s = await api.shipments.get(id);
    // An empty timeline is normal while the consumer catches up, not an error.
    const t = await api.tracking.timeline(id).catch(() => ({ events: [] as TrackingEvent[] }));
    return { s, events: t.events };
  }, [id]);

  const load = React.useCallback(async () => {
    const r = await fetchAll();
    setShipment(r.s);
    setEvents(r.events);
  }, [fetchAll]);

  React.useEffect(() => {
    let cancelled = false;
    void fetchAll()
      .then((r) => {
        if (cancelled) return;
        setShipment(r.s);
        setEvents(r.events);
      })
      .catch(() => { if (!cancelled) setError('Shipment not found.'); });
    return () => { cancelled = true; };
  }, [fetchAll]);

  async function advance(to: Parameters<typeof api.shipments.setStatus>[1]) {
    setBusy(true);
    setError(null);
    try {
      await api.shipments.setStatus(id, to);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the shipment.');
    } finally {
      setBusy(false);
    }
  }

  if (error && !shipment) {
    return <p className="text-sm text-[var(--muted)]">{error}</p>;
  }
  if (!shipment) {
    return <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-ink-100 dark:bg-ink-800" />;
  }

  const canAdvance = user && (user.role === 'ADMIN' || user.role === 'DRIVER');

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href="/shipments"><ArrowLeft className="size-4" />Shipments</Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight tabular-nums">{shipment.reference}</h1>
            <StatusBadge status={shipment.status} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--muted)]">
            <MapPin className="size-3.5" />{shipment.origin} → {shipment.destination}
          </p>
        </div>

        {canAdvance && !isTerminal(shipment.status) && (
          <div className="flex flex-wrap gap-2">
            {nextStatuses(shipment.status).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === 'CANCELLED' ? 'danger' : 'primary'}
                disabled={busy}
                onClick={() => void advance(s)}
              >
                {s === 'CANCELLED' ? 'Cancel' : `Mark ${STATUS_LABEL[s].toLowerCase()}`}
              </Button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader><CardTitle>Tracking timeline</CardTitle></CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--muted)]">
                No events recorded yet. Tracking updates arrive moments after each change.
              </p>
            ) : (
              <ol className="relative flex flex-col gap-5 pl-6">
                <span aria-hidden className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border)]" />
                {events.map((e, i) => (
                  <li key={e.id} className="relative">
                    <span
                      aria-hidden
                      className={`absolute -left-6 top-1 size-[15px] rounded-full border-2 border-[var(--bg)] ${
                        i === events.length - 1 ? 'bg-accent-500' : 'bg-ink-300 dark:bg-ink-600'
                      }`}
                    />
                    <p className="text-sm font-medium">{STATUS_LABEL[e.status as keyof typeof STATUS_LABEL] ?? e.status}</p>
                    <time className="flex items-center gap-1 text-xs text-[var(--muted)]" dateTime={e.occurredAt}>
                      <Clock className="size-3" />{new Date(e.occurredAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3 text-sm">
              {[
                ['Reference', shipment.reference],
                ['Status', STATUS_LABEL[shipment.status]],
                ['Driver', shipment.driverId ?? 'Not assigned'],
                ['Created', new Date(shipment.createdAt).toLocaleString()],
                ['Updated', new Date(shipment.updatedAt).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-[var(--muted)]">{k}</dt>
                  <dd className="truncate text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
