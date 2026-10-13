'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Clock, Hourglass, Locate, MapPin, Navigation, Pause, Play, Power, Truck, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useMyDriver, useSetAvailability, useSetStatus, useShipments, useTrail, errorMessage } from '@/hooks/queries';
import { useLiveTracking } from '@/hooks/use-live-tracking';
import { useLocationReporter } from '@/hooks/use-location-reporter';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { allowedStatusActions } from '@/lib/rbac';
import { bearing, endpointsOf, type LatLng } from '@/lib/geo';
import { STATUS_ACTION, formatKobo, isMoving, type Shipment } from '@/lib/types';
import { formatDate, telHref } from '@/lib/format';
import { PageContainer } from '@/components/app-shell';
import { RequireCapability } from '@/components/require-role';
import { PageHeader } from '@/components/page-header';
import { LiveMap } from '@/components/live-map';
import { StatusBadge } from '@/components/status-badge';
import { ProgressRail } from '@/components/progress-rail';
import { DriverEarningsCard } from '@/components/driver-earnings';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function DriverPage() {
  return (
    <RequireCapability cap="driver.self">
      <DriverHome />
    </RequireCapability>
  );
}

function DriverHome() {
  const { user } = useAuth();
  const me = useMyDriver();
  const jobs = useShipments({ limit: 100 }, { refetchInterval: 15_000 });

  if (!user) return null;
  if (me.isLoading) return <PageContainer><Skeleton className="h-10 w-72" /><Skeleton className="h-96" /></PageContainer>;
  if (me.data === null) return <Onboarding />;
  if (!me.data) return <PageContainer><EmptyState icon={Truck} title="Could not load your profile" description={errorMessage(me.error)} /></PageContainer>;

  const driver = me.data;
  const active = (jobs.data ?? []).filter((s) => s.status !== 'DELIVERED' && s.status !== 'CANCELLED');
  const current = active.find((s) => isMoving(s.status)) ?? active[0] ?? null;
  const history = (jobs.data ?? []).filter((s) => s.status === 'DELIVERED' || s.status === 'CANCELLED');

  return (
    <PageContainer>
      <PageHeader
        title={`Hi ${user.name.split(' ')[0]}`}
        description={`${driver.vehicleType}${driver.plateNumber ? ` · ${driver.plateNumber}` : ''}`}
        actions={<AvailabilityToggle driverId={driver.id} online={driver.availability === 'ONLINE'} onJob={!!driver.currentShipmentId} approved={!!driver.approvedAt} />}
      />

      {!driver.approvedAt ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <Hourglass className="mt-0.5 size-5 text-amber-600" />
          <div>
            <p className="font-semibold">Waiting for approval</p>
            <p className="text-sm text-muted">Dispatch reviews new drivers before they can go online. You&apos;ll be able to take jobs as soon as you&apos;re approved.</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {current ? <CurrentJob job={current} /> : (
            <Card>
              <CardContent className="pt-5">
                <EmptyState
                  icon={Navigation}
                  title={driver.availability === 'ONLINE' ? 'No job right now' : "You're offline"}
                  description={driver.availability === 'ONLINE' ? "Stay online - dispatch will assign your next delivery and it will appear here." : 'Go online to start receiving deliveries.'}
                />
              </CardContent>
            </Card>
          )}

          {active.length > 1 ? (
            <Card>
              <CardHeader><CardTitle>Up next</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {active.filter((s) => s.id !== current?.id).map((s) => (
                  <Link key={s.id} href={`/shipments/${s.id}`} className="flex items-center justify-between rounded-xl border border-line p-3 hover:bg-surface-2">
                    <span className="text-sm font-medium">{s.reference}</span><StatusBadge status={s.status} size="sm" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <DriverEarningsCard />
          <Card>
            <CardHeader><div><CardTitle>Recent jobs</CardTitle><CardDescription>{history.length} completed or cancelled</CardDescription></div></CardHeader>
            <CardContent className="space-y-1">
              {history.length === 0 ? <p className="text-sm text-muted">Nothing yet.</p> : history.slice(0, 6).map((s) => (
                <Link key={s.id} href={`/shipments/${s.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{s.reference}</p>
                    <p className="text-xs text-muted">{formatDate(s.updatedAt)}</p>
                  </div>
                  <StatusBadge status={s.status} size="sm" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function AvailabilityToggle({ driverId, online, onJob, approved }: { driverId: string; online: boolean; onJob: boolean; approved: boolean }) {
  const set = useSetAvailability();
  return (
    <button
      type="button"
      disabled={!approved || set.isPending || (online && onJob)}
      title={online && onJob ? 'Finish your current job before going offline' : undefined}
      onClick={() => set.mutate({ id: driverId, availability: online ? 'OFFLINE' : 'ONLINE' })}
      className={cn(
        'flex h-11 cursor-pointer items-center gap-3 rounded-full border pr-4 pl-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        online ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700' : 'border-line bg-surface text-muted',
      )}
    >
      <span className={cn('grid size-8 place-items-center rounded-full transition', online ? 'bg-emerald-500 text-white' : 'bg-surface-3')}>
        <Power className="size-4" />
      </span>
      {online ? (onJob ? 'On a job' : 'Online') : 'Offline'}
    </button>
  );
}

function CurrentJob({ job }: { job: Shipment }) {
  const { user } = useAuth();
  const setStatus = useSetStatus();
  const moving = isMoving(job.status);
  const live = useLiveTracking(job.id, job.status !== 'CREATED');
  const trail = useTrail(job.id, moving);
  // Keyed on the coordinates, not the job object: a refetch returns a new
  // object, and a new identity would restart the simulator mid-drive.
  const { originLat, originLng, destLat, destLng } = job;
  const ends = React.useMemo(() => endpointsOf({ originLat, originLng, destLat, destLng }), [originLat, originLng, destLat, destLng]);
  const trailPoints = React.useMemo<LatLng[]>(() => (trail.data ?? []).map((p) => [p.lat, p.lng]), [trail.data]);
  const vehicle: LatLng | null = live.location ? [live.location.lat, live.location.lng] : trailPoints.at(-1) ?? null;
  const reporter = useLocationReporter(moving ? job.id : null, ends?.from ?? null, ends?.to ?? null, vehicle);
  const heading = live.location?.heading ?? (trailPoints.length > 1 ? bearing(trailPoints.at(-2)!, trailPoints.at(-1)!) : null);

  if (!user) return null;
  const actions = allowedStatusActions(user, job);
  const nav = ends ? `https://www.google.com/maps/dir/?api=1&destination=${ends.to[0]},${ends.to[1]}` : null;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-xs font-medium text-muted">Current job</p>
          <p className="text-xl font-semibold tracking-tight">{job.reference}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          <Badge tone="neutral">{formatKobo(job.priceKobo)}</Badge>
        </div>
      </div>
      <div className="relative h-[380px] border-y border-line">
        <LiveMap
          from={ends?.from ?? null}
          to={ends?.to ?? null}
          vehicle={moving && vehicle ? { position: vehicle, heading } : null}
          trail={moving ? trailPoints : []}
          fitKey={job.id}
        />
        {reporter.mode !== 'off' ? (
          <div className="absolute top-3 left-3 z-[500] flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium shadow-[var(--shadow-card)]">
            <span className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-brand/70" /><span className="relative size-2 rounded-full bg-brand" /></span>
            {reporter.mode === 'gps' ? 'Sharing GPS' : 'Simulating drive'} · {reporter.sent} sent
          </div>
        ) : null}
      </div>

      <CardContent className="space-y-5 pt-5">
        <ProgressRail status={job.status} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-emerald-500" /><div><p className="text-xs text-muted">Pickup</p><p className="text-sm font-medium">{job.origin}</p></div></div>
          <div className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-brand" /><div><p className="text-xs text-muted">Dropoff</p><p className="text-sm font-medium">{job.destination}</p></div></div>
        </div>
        {job.notes ? <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted"><span className="font-medium text-fg">Note: </span>{job.notes}</p> : null}

        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button key={a} variant={a === 'DELIVERED' ? 'success' : 'primary'} loading={setStatus.isPending && setStatus.variables?.status === a} onClick={() => setStatus.mutate({ id: job.id, status: a })}>
              {a === 'DELIVERED' ? <Check /> : <Truck />}{STATUS_ACTION[a]}
            </Button>
          ))}
          {job.customerPhone ? <Button asChild variant="secondary"><a href={telHref(job.customerPhone)}>Call {job.customerName.split(' ')[0] || 'customer'}</a></Button> : null}
          {nav ? <Button asChild variant="secondary"><a href={nav} target="_blank" rel="noreferrer">Navigate <ArrowUpRight /></a></Button> : null}
          <Button asChild variant="ghost"><Link href={`/shipments/${job.id}`}>Details</Link></Button>
        </div>

        {moving ? (
          <div className="rounded-xl border border-line bg-surface-2 p-4">
            <p className="text-sm font-semibold">Live location</p>
            <p className="mt-0.5 text-[13px] text-muted">Your customer sees your position on their map while the parcel is with you.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {reporter.mode === 'gps' ? (
                <Button variant="secondary" onClick={() => reporter.setMode('off')}><Pause />Stop sharing</Button>
              ) : (
                <Button variant="soft" onClick={() => reporter.setMode('gps')}><Locate />Share my GPS</Button>
              )}
              {reporter.mode === 'sim' ? (
                <Button variant="secondary" onClick={() => reporter.setMode('off')}><Pause />Stop simulation</Button>
              ) : (
                <Button variant="secondary" onClick={() => reporter.setMode('sim')} disabled={!ends}><Play />Simulate drive</Button>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-faint"><Clock className="size-3" />The simulator drives the real road route, sped up, for testing.</p>
          </div>
        ) : job.status === 'CREATED' ? (
          <p className="text-[13px] text-muted">Mark it picked up once the parcel is in your vehicle - location sharing starts then.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Onboarding() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [vehicleType, setVehicleType] = React.useState('Van');
  const [plateNumber, setPlate] = React.useState('');
  const [phone, setPhone] = React.useState(user?.phone ?? '');
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.drivers.create({ vehicleType, ...(plateNumber ? { plateNumber } : {}), ...(phone ? { phone } : {}) });
      toast.success('Profile submitted for approval');
      await qc.invalidateQueries({ queryKey: ['drivers'] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer className="max-w-xl">
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-lg border border-line text-muted"><Truck className="size-6" /></span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Set up your driver profile</h1>
        <p className="mt-1 text-sm text-muted">Tell us what you drive. Dispatch approves new drivers before their first job.</p>
      </div>
      <Card>
        <CardContent className="pt-5">
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <Field label="Vehicle" htmlFor="vehicle">
              <Select id="vehicle" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                {['Motorbike', 'Car', 'Van', 'Truck', 'Bicycle'].map((v) => <option key={v}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Plate number" htmlFor="plate" hint="Optional">
              <Input id="plate" value={plateNumber} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="LND-123-AB" maxLength={20} />
            </Field>
            <Field label="Phone" htmlFor="phone" hint="Customers call this number when you arrive">
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 …" />
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={busy}>Submit for approval</Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
