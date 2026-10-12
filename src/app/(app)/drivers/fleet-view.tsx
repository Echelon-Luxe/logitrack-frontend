'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BadgeCheck, Search, ShieldOff, Truck, UserPlus } from 'lucide-react';
import { useApproveDriver, useAssign, useDrivers, useShipments } from '@/hooks/queries';
import { useAuth } from '@/hooks/use-auth';
import { PageContainer } from '@/components/app-shell';
import { RequireCapability } from '@/components/require-role';
import { PageHeader } from '@/components/page-header';
import { Input, Select } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { can } from '@/lib/rbac';
import { formatKobo, type Driver, type DriverStatus } from '@/lib/types';
import { telHref, timeAgo } from '@/lib/format';

type Filter = 'all' | 'available' | 'on_job' | 'offline' | 'pending';

const STATUS_BADGE: Record<DriverStatus, { tone: BadgeTone; label: string }> = {
  AVAILABLE: { tone: 'green', label: 'Available' },
  ON_JOB: { tone: 'violet', label: 'On a job' },
  OFFLINE: { tone: 'neutral', label: 'Offline' },
};

export function FleetView() {
  return <RequireCapability cap="drivers.read"><Fleet /></RequireCapability>;
}

function Fleet() {
  const { user } = useAuth();
  const params = useSearchParams();
  const [filter, setFilter] = React.useState<Filter>((params.get('filter') as Filter) ?? 'all');
  const [query, setQuery] = React.useState('');
  const drivers = useDrivers();
  const approve = useApproveDriver();
  const canApprove = can(user?.role, 'drivers.approve');
  const canAssign = can(user?.role, 'shipment.assign');

  const all = drivers.data ?? [];
  const matches: Record<Filter, (d: Driver) => boolean> = {
    all: () => true,
    available: (d) => !!d.approvedAt && d.status === 'AVAILABLE',
    on_job: (d) => d.status === 'ON_JOB',
    offline: (d) => !!d.approvedAt && d.status === 'OFFLINE',
    pending: (d) => !d.approvedAt,
  };
  const q = query.trim().toLowerCase();
  const rows = all.filter(matches[filter]).filter((d) => !q || [d.name, d.vehicleType, d.plateNumber ?? ''].some((v) => v.toLowerCase().includes(q)));
  const count = (f: Filter) => all.filter(matches[f]).length;

  return (
    <PageContainer>
      <PageHeader title="Fleet" description="Approve drivers, see who's free, and dispatch the queue." />

      {canAssign ? <DispatchQueue /> : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Filter>
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: count('all') },
            { value: 'available', label: 'Available', count: count('available') },
            { value: 'on_job', label: 'On a job', count: count('on_job') },
            { value: 'offline', label: 'Offline', count: count('offline') },
            { value: 'pending', label: 'Pending approval', count: count('pending') },
          ]}
        />
        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drivers" className="pl-9" aria-label="Search drivers" />
        </div>
      </div>

      {drivers.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Truck} title="No drivers here" description={filter === 'pending' ? 'Nobody is waiting for approval.' : 'Try another filter.'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => {
            const badge = STATUS_BADGE[d.status];
            return (
              <div key={d.id} className="flex flex-col rounded-xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3">
                  <Avatar name={d.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{d.name}</p>
                    <p className="truncate text-xs text-muted">{d.vehicleType}{d.plateNumber ? ` · ${d.plateNumber}` : ''}</p>
                  </div>
                  {d.approvedAt ? <Badge tone={badge.tone} dot size="sm">{badge.label}</Badge> : <Badge tone="amber" size="sm">Pending</Badge>}
                </div>
                <div className="mt-4 flex-1 space-y-1 text-[13px] text-muted">
                  {d.phone ? <p><a className="hover:text-fg" href={telHref(d.phone)}>{d.phone}</a></p> : <p className="text-faint">No phone on file</p>}
                  {d.currentShipmentId ? <p>On <Link className="font-medium text-brand hover:underline" href={`/tracking?id=${d.currentShipmentId}`}>live job →</Link></p> : null}
                  <p className="text-faint">Joined {timeAgo(d.createdAt)}</p>
                </div>
                {canApprove ? (
                  <div className="mt-4 flex gap-2 border-t border-line pt-4">
                    {d.approvedAt ? (
                      <Button size="sm" variant="ghost" onClick={() => { if (window.confirm(`Revoke ${d.name}'s approval? They will be taken offline.`)) approve.mutate({ id: d.id, approved: false }); }} disabled={!!d.currentShipmentId}>
                        <ShieldOff />Revoke
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => approve.mutate({ id: d.id, approved: true })} loading={approve.isPending && approve.variables?.id === d.id}>
                        <BadgeCheck />Approve driver
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}

// Unassigned shipments with a one-click driver picker - the dispatcher's main job.
function DispatchQueue() {
  const queue = useShipments({ status: 'CREATED', limit: 50 }, { refetchInterval: 15_000 });
  const available = useDrivers({ available: true });
  const assign = useAssign();
  const [choice, setChoice] = React.useState<Record<string, string>>({});
  const unassigned = (queue.data ?? []).filter((s) => !s.driverId);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Dispatch queue</CardTitle>
          <CardDescription>{unassigned.length} waiting · {available.data?.length ?? 0} drivers free</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {queue.isLoading ? <Skeleton className="h-24" /> : unassigned.length === 0 ? (
          <p className="rounded-xl bg-surface-2 p-4 text-sm text-muted">Queue is clear - every shipment has a driver.</p>
        ) : (
          <ul className="divide-y divide-line">
            {unassigned.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <Link href={`/shipments/${s.id}`} className="text-sm font-semibold hover:text-brand">{s.reference}</Link>
                  <span className="text-sm text-muted"> · {s.customerName} · {formatKobo(s.priceKobo)}</span>
                  <p className="truncate text-xs text-muted">{s.origin} → {s.destination}</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-52">
                    <Select value={choice[s.id] ?? ''} onChange={(e) => setChoice((c) => ({ ...c, [s.id]: e.target.value }))} aria-label={`Driver for ${s.reference}`} className="h-9">
                      <option value="">{available.data?.length ? 'Choose driver…' : 'No drivers free'}</option>
                      {available.data?.map((d) => <option key={d.id} value={d.id}>{d.name} · {d.vehicleType}</option>)}
                    </Select>
                  </div>
                  <Button
                    size="sm"
                    className="h-9"
                    disabled={!choice[s.id]}
                    loading={assign.isPending && assign.variables?.id === s.id}
                    onClick={() => assign.mutate({ id: s.id, driverId: choice[s.id]! })}
                  ><UserPlus />Assign</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
