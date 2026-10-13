'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock, Package, Plus, Truck, Wallet, Users, Compass } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLivePositions, useShipments, useShipmentStats, useUserSummary, useDrivers } from '@/hooks/queries';
import { PageContainer } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { StatTile } from '@/components/stat-tile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge, STATUS_COLOR } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { DailyChart } from '@/components/charts/daily-chart';
import { StatusBreakdown } from '@/components/charts/status-breakdown';
import { LiveMap, type FleetDot } from '@/components/live-map';
import { can, isStaff } from '@/lib/rbac';
import { formatKobo, type ShipmentStatus } from '@/lib/types';
import { timeAgo } from '@/lib/format';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const staff = isStaff(user?.role);

  // Drivers have their own home.
  React.useEffect(() => { if (user?.role === 'DRIVER') router.replace('/driver'); }, [user, router]);

  const stats = useShipmentStats();
  const recent = useShipments({ limit: 6 });
  const people = useUserSummary(staff);
  const drivers = useDrivers({}, staff);
  const live = useLivePositions(staff);
  const active = useShipments({ statuses: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'], limit: 100 }, { enabled: staff, refetchInterval: 15_000 });

  if (!user || user.role === 'DRIVER') return null;

  const by = stats.data?.byStatus ?? {};
  const moving = (by.PICKED_UP ?? 0) + (by.IN_TRANSIT ?? 0) + (by.OUT_FOR_DELIVERY ?? 0);
  const pendingDrivers = drivers.data?.filter((d) => !d.approvedAt).length ?? 0;
  const availableDrivers = drivers.data?.filter((d) => d.status === 'AVAILABLE').length ?? 0;

  const fleet: FleetDot[] = (live.data ?? []).flatMap((p) => {
    const s = active.data?.find((x) => x.id === p.shipmentId);
    if (!s) return [];
    return [{
      id: p.shipmentId,
      position: [p.lat, p.lng] as [number, number],
      label: `${s.reference} · ${s.driverName ?? ''}`,
      color: STATUS_COLOR[s.status as ShipmentStatus],
      onClick: () => router.push(`/tracking?id=${s.id}`),
    }];
  });

  return (
    <PageContainer>
      <PageHeader
        title={`${greeting()}, ${user.name.split(' ')[0]}`}
        description={staff ? "Here's what's moving across the network today." : 'Your deliveries at a glance.'}
        actions={
          <>
            <Button asChild variant="secondary"><Link href="/tracking"><Compass />Live tracking</Link></Button>
            {can(user.role, 'shipment.create') ? <Button asChild><Link href="/shipments/new"><Plus />New shipment</Link></Button> : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.isLoading ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[124px] rounded-xl" />) : (
          <>
            <StatTile label={staff ? 'All shipments' : 'My shipments'} value={stats.data?.total ?? 0} icon={Package} hint={`${by.CANCELLED ?? 0} cancelled`} />
            <StatTile label="On the road" value={moving} icon={Truck} tone="violet" hint={`${by.OUT_FOR_DELIVERY ?? 0} out for delivery`} />
            <StatTile label="Awaiting pickup" value={by.CREATED ?? 0} icon={Clock} tone="amber" hint={staff ? `${availableDrivers} drivers available` : 'Waiting for a driver'} />
            {staff ? (
              <StatTile label="Booked revenue" value={formatKobo(stats.data?.revenueKobo ?? 0)} icon={Wallet} tone="green" hint={`${by.DELIVERED ?? 0} delivered`} />
            ) : (
              <StatTile label="Delivered" value={by.DELIVERED ?? 0} icon={CheckCircle2} tone="green" hint={`${formatKobo(stats.data?.revenueKobo ?? 0)} total booked`} />
            )}
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Shipments, last 14 days</CardTitle>
              <CardDescription>Created per day, and how many of those are delivered</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {stats.data ? <DailyChart data={stats.data.daily} /> : <Skeleton className="h-64" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>By status</CardTitle>
              <CardDescription>Where every shipment is right now</CardDescription>
            </div>
          </CardHeader>
          <CardContent>{stats.data ? <StatusBreakdown byStatus={by} /> : <Skeleton className="h-56" />}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className={staff ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <CardHeader>
            <div>
              <CardTitle>Recent shipments</CardTitle>
              <CardDescription>Latest bookings{staff ? ' across all customers' : ''}</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm"><Link href="/orders">View all <ArrowRight /></Link></Button>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {recent.isLoading ? <Skeleton className="mx-3 mb-3 h-48" /> : !recent.data?.length ? (
              <div className="p-3">
                <EmptyState icon={Package} title="No shipments yet" description="Book a delivery and it will show up here." />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {recent.data.map((s) => (
                  <li key={s.id}>
                    <Link href={`/shipments/${s.id}`} className="flex items-center gap-4 rounded-xl px-3 py-3 transition hover:bg-surface-2">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface-2"><Package className="size-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{s.reference} <span className="font-normal text-muted">· {staff ? s.customerName : formatKobo(s.priceKobo)}</span></p>
                        <p className="truncate text-xs text-muted">{s.origin} → {s.destination}</p>
                      </div>
                      <span className="hidden text-xs text-faint sm:block">{timeAgo(s.createdAt)}</span>
                      <StatusBadge status={s.status} size="sm" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {staff ? (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader>
                <div>
                  <CardTitle>Live fleet</CardTitle>
                  <CardDescription>{fleet.length} vehicle{fleet.length === 1 ? '' : 's'} reporting</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm"><Link href="/tracking">Open <ArrowRight /></Link></Button>
              </CardHeader>
              <div className="h-56 border-t border-line">
                <LiveMap fleet={fleet} fitKey={`fleet-${fleet.length}`} showLabels={false} />
              </div>
            </Card>
            <Card>
              <CardHeader className="pb-4">
                <div>
                  <CardTitle>People</CardTitle>
                  <CardDescription>Active accounts by role</CardDescription>
                </div>
                <Users className="size-4 text-muted" />
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 text-center">
                {(['CUSTOMER', 'DRIVER', 'DISPATCHER'] as const).map((r) => (
                  <div key={r} className="rounded-xl bg-surface-2 py-3">
                    <p className="text-xl font-semibold tabular-nums">{people.data?.[r] ?? '–'}</p>
                    <p className="text-[11px] text-muted capitalize">{r.toLowerCase()}s</p>
                  </div>
                ))}
                {pendingDrivers > 0 && can(user.role, 'drivers.approve') ? (
                  <Link href="/drivers?filter=pending" className="col-span-3 mt-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left text-[13px] font-medium text-amber-700">
                    {pendingDrivers} driver{pendingDrivers === 1 ? '' : 's'} waiting for approval →
                  </Link>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
      {!staff && moving > 0 ? (
        <p className="text-center text-sm text-muted">
          You have {moving} shipment{moving === 1 ? '' : 's'} on the road — <Link className="font-medium text-brand hover:underline" href="/tracking">watch live</Link>.
        </p>
      ) : null}
    </PageContainer>
  );
}
