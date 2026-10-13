'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Check, CreditCard, Copy, ExternalLink, Gauge, MapPin, PackageX, StickyNote, Truck, UserPlus, Wallet, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useAssign, useDrivers, usePayments, useSetStatus, useShipment, useTimeline, useTrail, errorMessage } from '@/hooks/queries';
import { useLiveTracking } from '@/hooks/use-live-tracking';
import { api, ApiError } from '@/lib/api';
import { allowedStatusActions, can } from '@/lib/rbac';
import { bearing, endpointsOf, type LatLng } from '@/lib/geo';
import { formatDateTime, timeAgo } from '@/lib/format';
import {
  STATUS_ACTION, STATUS_LABEL, formatKobo, isMoving, type ShipmentStatus,
} from '@/lib/types';
import { PageContainer } from '@/components/app-shell';
import { LiveMap } from '@/components/live-map';
import { StatusBadge } from '@/components/status-badge';
import { ContactRow } from '@/components/contact-row';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const STEPS: ShipmentStatus[] = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const shipment = useShipment(id);
  const s = shipment.data;
  const timeline = useTimeline(id);
  const moving = s ? isMoving(s.status) : false;
  const live = useLiveTracking(id, !!s && s.status !== 'CREATED');
  const trail = useTrail(id, moving);
  const payments = usePayments(id, !!s && (s.customerId === user?.id || can(user?.role, 'payments.readAll')));
  const setStatus = useSetStatus();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [paying, setPaying] = React.useState(false);

  const trailPoints = React.useMemo<LatLng[]>(() => (trail.data ?? []).map((p) => [p.lat, p.lng]), [trail.data]);

  if (shipment.isError) {
    const notFound = shipment.error instanceof ApiError && shipment.error.status === 404;
    return (
      <PageContainer>
        <EmptyState
          icon={PackageX}
          title={notFound ? 'Shipment not found' : 'Could not load this shipment'}
          description={notFound ? "It doesn't exist, or it isn't one you can see." : errorMessage(shipment.error)}
          action={<Button asChild variant="secondary"><Link href="/orders">Back to orders</Link></Button>}
        />
      </PageContainer>
    );
  }
  if (!s || !user) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-[420px] lg:col-span-2" /><Skeleton className="h-[420px]" /></div>
      </PageContainer>
    );
  }

  const ends = endpointsOf(s);
  const vehicle: LatLng | null = moving ? (live.location ? [live.location.lat, live.location.lng] : trailPoints.at(-1) ?? null) : null;
  const heading = live.location?.heading ?? (trailPoints.length > 1 ? bearing(trailPoints.at(-2)!, trailPoints.at(-1)!) : null);
  const actions = allowedStatusActions(user, s);
  const paid = payments.data?.some((p) => p.status === 'SUCCEEDED');
  const canPay = can(user.role, 'payments.pay') && s.customerId === user.id && !paid && s.status !== 'CANCELLED' && s.priceKobo > 0;
  const canAssign = can(user.role, 'shipment.assign') && s.status === 'CREATED';
  const reached = (step: ShipmentStatus) =>
    s.status !== 'CANCELLED' && STEPS.indexOf(step) <= STEPS.indexOf(s.status);
  const eventFor = (step: ShipmentStatus) => timeline.data?.events.find((e) => e.status === step);

  const pay = async () => {
    setPaying(true);
    try {
      const init = await api.payments.initialize(s.id);
      window.location.href = init.authorizationUrl;
    } catch (e) {
      toast.error(errorMessage(e));
      setPaying(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button onClick={() => router.back()} className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" />Back</button>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{s.reference}</h1>
            <button
              className="cursor-pointer text-faint hover:text-fg"
              onClick={() => { void navigator.clipboard.writeText(s.reference); toast.success('Reference copied'); }}
              aria-label="Copy reference"
            ><Copy className="size-4" /></button>
            <StatusBadge status={s.status} />
            {paid ? <Badge tone="green" dot>Paid</Badge> : s.status !== 'CANCELLED' ? <Badge tone="amber" dot>Unpaid</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted">Booked {formatDateTime(s.createdAt)} · {formatKobo(s.priceKobo)}{s.distanceKm ? ` · ${s.distanceKm} km` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPay ? <Button onClick={() => void pay()} loading={paying}><CreditCard />Pay {formatKobo(s.priceKobo)}</Button> : null}
          {canAssign ? <Button variant={s.driverId ? 'secondary' : 'primary'} onClick={() => setAssignOpen(true)}><UserPlus />{s.driverId ? 'Reassign driver' : 'Assign driver'}</Button> : null}
          {actions.filter((a) => a !== 'CANCELLED').map((a) => (
            <Button key={a} variant={a === 'DELIVERED' ? 'success' : 'primary'} loading={setStatus.isPending && setStatus.variables?.status === a} onClick={() => setStatus.mutate({ id: s.id, status: a })}>
              {a === 'DELIVERED' ? <Check /> : <Truck />}{STATUS_ACTION[a]}
            </Button>
          ))}
          {actions.includes('CANCELLED') ? (
            <Button
              variant="danger-soft"
              onClick={() => { if (window.confirm(`Cancel ${s.reference}? This cannot be undone.`)) setStatus.mutate({ id: s.id, status: 'CANCELLED' }); }}
            ><X />Cancel</Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="relative h-[420px]">
              <LiveMap
                from={ends?.from ?? null}
                to={ends?.to ?? null}
                vehicle={vehicle ? { position: vehicle, heading } : null}
                trail={moving ? trailPoints : []}
                fitKey={s.id}
              />
              {moving ? (
                <div className="absolute top-3 right-3 z-[500] flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium shadow-[var(--shadow-card)]">
                  <span className="relative flex size-2">
                    {live.connected ? <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/70" /> : null}
                    <span className={cn('relative size-2 rounded-full', live.connected ? 'bg-emerald-500' : 'bg-amber-500')} />
                  </span>
                  {live.connected ? 'Live' : 'Reconnecting…'}
                  {live.location?.speedKph ? <span className="flex items-center gap-1 text-muted"><Gauge className="size-3" />{Math.round(live.location.speedKph)} km/h</span> : null}
                  {live.location ? <span className="text-muted">· {timeAgo(live.location.recordedAt)}</span> : null}
                </div>
              ) : null}
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Address label="Pickup" tone="pickup" text={s.origin} />
              <Address label="Dropoff" tone="dropoff" text={s.destination} />
            </div>
          </Card>

          <Card>
            <CardHeader><div><CardTitle>Journey</CardTitle><CardDescription>Every step, as it happened</CardDescription></div></CardHeader>
            <CardContent>
              {s.status === 'CANCELLED' ? (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/8 px-4 py-3 text-sm text-rose-700">
                  <X className="size-4" />Cancelled {eventFor('CANCELLED') ? timeAgo(eventFor('CANCELLED')!.occurredAt) : ''}
                </div>
              ) : null}
              <ol className="relative">
                {STEPS.map((step, i) => {
                  const done = reached(step);
                  const current = s.status === step;
                  const ev = eventFor(step);
                  return (
                    <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < STEPS.length - 1 ? <span className={cn('absolute top-8 bottom-0 left-[15px] w-0.5', reached(STEPS[i + 1]!) ? 'bg-emerald-500' : 'bg-line')} /> : null}
                      <span className={cn(
                        'relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold',
                        done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-line bg-surface text-faint',
                        current && !['DELIVERED'].includes(step) && 'ring-2 ring-emerald-500/25',
                      )}>
                        {done ? <Check className="size-4" /> : i + 1}
                      </span>
                      <div className="pt-1">
                        <p className={cn('text-sm font-semibold', !done && 'text-muted')}>{STATUS_LABEL[step]}</p>
                        <p className="text-xs text-muted">{ev ? formatDateTime(ev.occurredAt) : current ? 'Now' : done ? 'Recorded' : 'Pending'}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {timeline.data?.events.length === 0 ? <p className="mt-3 text-xs text-faint">Timeline is catching up…</p> : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4"><CardTitle>People</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <ContactRow name={s.customerName || 'Customer'} role="Customer" phone={s.customerPhone} email={s.customerEmail} />
              <div className="border-t border-line" />
              {s.driverName ? (
                <ContactRow name={s.driverName} role="Driver" phone={s.driverPhone} />
              ) : (
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full border-2 border-dashed border-line-strong text-faint"><Truck className="size-4" /></span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">No driver yet</p>
                    <p className="text-xs text-muted">{canAssign ? 'Assign one to get it moving' : 'Dispatch will assign one shortly'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {s.notes ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2"><StickyNote className="size-4 text-muted" />Notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap text-muted">{s.notes}</p></CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-3"><div><CardTitle className="flex items-center gap-2"><Wallet className="size-4 text-muted" />Payment</CardTitle><CardDescription>{formatKobo(s.priceKobo)} quoted at booking</CardDescription></div></CardHeader>
            <CardContent className="space-y-2">
              {payments.data?.length ? payments.data.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium tabular-nums">{formatKobo(p.amount, p.currency)}</p>
                    <p className="text-xs text-muted">{p.paidAt ? formatDateTime(p.paidAt) : formatDateTime(p.createdAt)}{p.channel ? ` · ${p.channel}` : ''}</p>
                  </div>
                  <Badge tone={p.status === 'SUCCEEDED' ? 'green' : p.status === 'PENDING' ? 'amber' : 'rose'} size="sm">{p.status.toLowerCase()}</Badge>
                </div>
              )) : <p className="text-sm text-muted">{payments.isFetching ? 'Loading…' : canPay ? 'Not paid yet.' : 'No payments visible to you.'}</p>}
              {canPay ? <Button className="mt-2 w-full" onClick={() => void pay()} loading={paying}><CreditCard />Pay now</Button> : null}
            </CardContent>
          </Card>

          <Button asChild variant="secondary" className="w-full"><Link href={`/tracking?id=${s.id}`}><ExternalLink />Open in live tracking</Link></Button>
        </div>
      </div>

      {canAssign ? <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} shipmentId={s.id} /> : null}
    </PageContainer>
  );
}

function Address({ label, text, tone }: { label: string; text: string; tone: 'pickup' | 'dropoff' }) {
  return (
    <div className="flex gap-3">
      <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl', tone === 'pickup' ? 'bg-emerald-500/12 text-emerald-600' : 'bg-brand-soft text-brand')}>
        <MapPin className="size-4" />
      </span>
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="text-sm font-medium">{text}</p>
      </div>
    </div>
  );
}

function AssignDialog({ open, onOpenChange, shipmentId }: { open: boolean; onOpenChange: (o: boolean) => void; shipmentId: string }) {
  const drivers = useDrivers({ available: true }, open);
  const assign = useAssign();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Assign a driver" description="Only approved drivers who are online and idle are listed.">
        {drivers.isLoading ? <Skeleton className="h-32" /> : !drivers.data?.length ? (
          <EmptyState icon={Truck} title="No drivers available" description="Everyone is offline or on a job. Try again shortly." className="py-8" />
        ) : (
          <ul className="space-y-2">
            {drivers.data.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <Avatar name={d.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{d.name}</p>
                  <p className="text-xs text-muted">{d.vehicleType}{d.plateNumber ? ` · ${d.plateNumber}` : ''}</p>
                </div>
                <Button
                  size="sm"
                  loading={assign.isPending && assign.variables?.driverId === d.id}
                  onClick={() => assign.mutate({ id: shipmentId, driverId: d.id }, { onSuccess: () => onOpenChange(false) })}
                >Assign</Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
