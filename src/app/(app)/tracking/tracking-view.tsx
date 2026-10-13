'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpRight, Gauge, MoreVertical, PackageSearch, Plus, Radio, Search, Clock, Route } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLivePositions, useShipments, useTrail } from '@/hooks/queries';
import { useLiveTracking } from '@/hooks/use-live-tracking';
import { LiveMap, type FleetDot } from '@/components/live-map';
import { ShipmentCard } from '@/components/shipment-card';
import { StatusBadge, STATUS_COLOR } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { can, isStaff } from '@/lib/rbac';
import { endpointsOf, haversineKm, nearestIndex, bearing, type LatLng } from '@/lib/geo';
import { isMoving, formatKobo, type Shipment, type ShipmentStatus } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

type Filter = 'active' | 'pending' | 'moving' | 'delivered' | 'all';

const FILTERS: Record<Filter, (s: Shipment) => boolean> = {
  active: (s) => s.status !== 'DELIVERED' && s.status !== 'CANCELLED',
  pending: (s) => s.status === 'CREATED',
  moving: (s) => isMoving(s.status),
  delivered: (s) => s.status === 'DELIVERED',
  all: () => true,
};

// Average urban speed for an ETA when the live speed is unknown or zero.
const FALLBACK_KPH = 22;

export function TrackingView() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [filter, setFilter] = React.useState<Filter>('active');
  const [query, setQuery] = React.useState('');
  const [route, setRoute] = React.useState<LatLng[]>([]);

  const list = useShipments({ limit: 200 }, { refetchInterval: 15_000 });
  const all = React.useMemo(() => list.data ?? [], [list.data]);

  const counts = React.useMemo(() => {
    const c = {} as Record<Filter, number>;
    for (const f of Object.keys(FILTERS) as Filter[]) c[f] = all.filter(FILTERS[f]).length;
    return c;
  }, [all]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    // Moving shipments first: they are the ones worth watching.
    const rank = (s: Shipment) => (isMoving(s.status) ? 0 : s.status === 'CREATED' ? 1 : 2);
    return all
      .filter(FILTERS[filter])
      .filter((s) => !q || [s.reference, s.origin, s.destination, s.customerName, s.driverName ?? ''].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => rank(a) - rank(b));
  }, [all, filter, query]);

  const selectedId = params.get('id') ?? visible.find((s) => isMoving(s.status))?.id ?? visible[0]?.id ?? null;
  const selected = all.find((s) => s.id === selectedId) ?? null;
  const select = (id: string) => router.replace(`/tracking?id=${id}`, { scroll: false });

  const moving = selected ? isMoving(selected.status) : false;
  const live = useLiveTracking(selected?.id, !!selected && selected.status !== 'CREATED');
  const trail = useTrail(selected?.id, moving);

  const ends = selected ? endpointsOf(selected) : null;
  const trailPoints = React.useMemo<LatLng[]>(() => (trail.data ?? []).map((p) => [p.lat, p.lng]), [trail.data]);
  const vehiclePos = React.useMemo<LatLng | null>(() => {
    if (!moving) return null;
    return live.location ? [live.location.lat, live.location.lng] : trailPoints.at(-1) ?? null;
  }, [moving, live.location, trailPoints]);
  const heading = live.location?.heading
    ?? (trailPoints.length > 1 ? bearing(trailPoints.at(-2)!, trailPoints.at(-1)!) : null);

  // Progress and remaining distance along the actual road route.
  const { progress, remainingKm } = React.useMemo(() => {
    if (!vehiclePos || route.length < 2) return { progress: null, remainingKm: null };
    const i = nearestIndex(route, vehiclePos);
    let rest = 0;
    for (let k = i; k < route.length - 1; k++) rest += haversineKm(route[k]!, route[k + 1]!);
    let total = 0;
    for (let k = 0; k < route.length - 1; k++) total += haversineKm(route[k]!, route[k + 1]!);
    return { progress: total > 0 ? 1 - rest / total : null, remainingKm: rest };
  }, [vehiclePos, route]);

  const speed = live.location?.speedKph ?? trail.data?.at(-1)?.speedKph ?? null;
  const etaMin = remainingKm !== null ? Math.max(1, Math.round((remainingKm / (speed && speed > 3 ? speed : FALLBACK_KPH)) * 60)) : null;

  // Staff see every other moving vehicle as a dot, clickable to switch focus.
  const livePositions = useLivePositions(!!user && can(user.role, 'fleet.live'));
  const fleet = React.useMemo<FleetDot[]>(() => {
    const byId = new Map(all.map((s) => [s.id, s]));
    return (livePositions.data ?? [])
      .filter((p) => p.shipmentId !== selected?.id && byId.get(p.shipmentId) && isMoving(byId.get(p.shipmentId)!.status))
      .map((p) => {
        const s = byId.get(p.shipmentId)!;
        return {
          id: p.shipmentId,
          position: [p.lat, p.lng] as LatLng,
          label: `${s.reference} · ${s.driverName ?? 'Driver'}`,
          color: STATUS_COLOR[s.status as ShipmentStatus],
          onClick: () => select(p.shipmentId),
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- select is stable enough; router.replace identity changes
  }, [livePositions.data, all, selected?.id]);

  if (!user) return null;

  return (
    <div className="flex h-full min-h-[640px] flex-col lg:flex-row">
      {/* List */}
      <section className="flex min-h-0 w-full flex-col border-line lg:w-[460px] lg:shrink-0 lg:border-r">
        <div className="space-y-4 p-5 pb-4 sm:p-6 sm:pb-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-[30px] font-extrabold tracking-tight">Tracking Delivery</h1>
            <div className="flex gap-2">
              {can(user.role, 'shipment.create') ? (
                <Button asChild size="icon-sm" variant="secondary" title="New shipment">
                  <Link href="/shipments/new" aria-label="New shipment"><Plus /></Link>
                </Button>
              ) : null}
              <Button asChild size="icon-sm" variant="secondary" title="All orders">
                <Link href="/orders" aria-label="All orders"><MoreVertical /></Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reference, address or name" className="pl-9" aria-label="Filter shipments" />
          </div>
          <Segmented<Filter>
            size="sm"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'active', label: 'Active', count: counts.active },
              { value: 'moving', label: 'On the road', count: counts.moving },
              { value: 'pending', label: 'Pending', count: counts.pending },
              { value: 'delivered', label: 'Delivered', count: counts.delivered },
              { value: 'all', label: 'All', count: counts.all },
            ]}
          />
        </div>

        <div className="scroll-thin min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-6 sm:px-6">
          {list.isLoading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-[230px] rounded-3xl" />)
          ) : visible.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title={all.length === 0 ? 'No shipments yet' : 'Nothing matches'}
              description={all.length === 0
                ? (can(user.role, 'shipment.create') ? 'Create your first shipment and follow it here in real time.' : 'Shipments assigned to you will appear here.')
                : 'Try another filter or search term.'}
              action={all.length === 0 && can(user.role, 'shipment.create') ? <Button asChild variant="accent"><Link href="/shipments/new"><Plus />New shipment</Link></Button> : undefined}
            />
          ) : (
            visible.map((s) => (
              <ShipmentCard
                key={s.id}
                shipment={s}
                viewerRole={user.role}
                selected={s.id === selected?.id}
                progress={s.id === selected?.id ? progress : null}
                onSelect={() => select(s.id)}
              />
            ))
          )}
        </div>
      </section>

      {/* Map */}
      <section className="relative min-h-[420px] flex-1 overflow-hidden lg:rounded-r-3xl">
        <LiveMap
          from={ends?.from ?? null}
          to={ends?.to ?? null}
          vehicle={vehiclePos ? { position: vehiclePos, heading } : null}
          trail={moving ? trailPoints : []}
          fleet={isStaff(user.role) ? fleet : []}
          fitKey={selected?.id ?? 'none'}
          onRoute={setRoute}
          padBottom={280}
          className="z-0"
        />

        {selected ? (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[500] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[360px]">
            <div className="pointer-events-auto rounded-3xl border border-line bg-surface p-4 shadow-[var(--shadow-pop)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted">Shipment</p>
                  <p className="font-display text-xl font-extrabold tracking-tight">{selected.reference}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Metric icon={Clock} label="ETA" value={moving && etaMin !== null ? `${etaMin} min` : selected.status === 'DELIVERED' ? 'Done' : '—'} />
                <Metric icon={Route} label="Remaining" value={moving && remainingKm !== null ? `${remainingKm.toFixed(1)} km` : selected.distanceKm ? `${selected.distanceKm} km` : '—'} />
                <Metric icon={Gauge} label="Speed" value={moving && speed ? `${Math.round(speed)} km/h` : '—'} />
              </div>

              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-surface-2 p-2.5">
                <Avatar name={selected.driverName ?? '?'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{selected.driverName ?? 'No driver yet'}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    {moving ? (
                      <>
                        <span className={cn('size-1.5 rounded-full', live.connected ? 'bg-emerald-500' : 'bg-amber-500')} />
                        {live.connected ? 'Live' : 'Reconnecting'}
                        {live.location ? ` · updated ${timeAgo(live.location.recordedAt)}` : ''}
                      </>
                    ) : selected.status === 'CREATED' ? 'Awaiting pickup' : `${formatKobo(selected.priceKobo)}`}
                  </p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/shipments/${selected.id}`}>Details <ArrowUpRight /></Link>
                </Button>
              </div>

              {moving && !vehiclePos ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><Radio className="size-3.5" />Waiting for the driver&apos;s first location…</p>
              ) : null}
              {!ends ? <p className="mt-2 text-xs text-muted">This shipment has no map coordinates.</p> : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

const Metric = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="rounded-2xl border border-line px-2 py-2">
    <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-muted"><Icon className="size-3" />{label}</p>
    <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
  </div>
);
