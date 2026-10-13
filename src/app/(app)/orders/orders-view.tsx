'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Package, Plus, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useShipments } from '@/hooks/queries';
import { PageContainer } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { can, isStaff } from '@/lib/rbac';
import { SHIPMENT_STATUSES, STATUS_LABEL, formatKobo, type ShipmentStatus } from '@/lib/types';
import { formatDate, splitAddress } from '@/lib/format';

type Filter = ShipmentStatus | 'ALL';

export function OrdersView() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [filter, setFilter] = React.useState<Filter>((params.get('status') as Filter) ?? 'ALL');
  const [query, setQuery] = React.useState(params.get('q') ?? '');
  const [debounced, setDebounced] = React.useState(query);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Server-side search; status filtering client-side so the chip counts stay true.
  const list = useShipments({ q: debounced || undefined, limit: 200 }, { refetchInterval: 30_000 });
  const rows = React.useMemo(() => (list.data ?? []).filter((s) => filter === 'ALL' || s.status === filter), [list.data, filter]);
  const counts = React.useMemo(() => {
    const c: Record<string, number> = { ALL: list.data?.length ?? 0 };
    for (const s of list.data ?? []) c[s.status] = (c[s.status] ?? 0) + 1;
    return c;
  }, [list.data]);

  if (!user) return null;
  const staff = isStaff(user.role);

  const exportCsv = () => {
    const header = ['reference', 'status', 'customer', 'driver', 'origin', 'destination', 'price_ngn', 'created_at'];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = rows.map((s) => [s.reference, s.status, s.customerName, s.driverName ?? '', s.origin, s.destination, String(s.priceKobo / 100), s.createdAt].map(esc).join(','));
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `logitrack-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Orders"
        description={staff ? 'Every shipment on the platform.' : user.role === 'DRIVER' ? 'Jobs assigned to you.' : 'Everything you have booked.'}
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={!rows.length}><Download />Export CSV</Button>
            {can(user.role, 'shipment.create') ? <Button asChild variant="accent"><Link href="/shipments/new"><Plus />New shipment</Link></Button> : null}
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Filter>
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[{ value: 'ALL', label: 'All', count: counts.ALL ?? 0 }, ...SHIPMENT_STATUSES.map((s) => ({ value: s as Filter, label: STATUS_LABEL[s], count: counts[s] ?? 0 }))]}
        />
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reference, address, person" className="pl-9" aria-label="Search orders" />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-card)]">
        {list.isLoading ? (
          <div className="space-y-2 p-4">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : rows.length === 0 ? (
          <div className="p-6"><EmptyState icon={Package} title="No orders found" description="Try a different status or search." /></div>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs font-medium text-muted">
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-3 py-3 font-medium">Route</th>
                  {staff ? <th className="px-3 py-3 font-medium">Customer</th> : null}
                  <th className="px-3 py-3 font-medium">Driver</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 text-right font-medium">Price</th>
                  <th className="px-5 py-3 text-right font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((s) => (
                  <tr key={s.id} onClick={() => router.push(`/shipments/${s.id}`)} className="cursor-pointer transition hover:bg-surface-2">
                    <td className="px-5 py-3.5">
                      <Link href={`/shipments/${s.id}`} className="font-semibold hover:text-brand" onClick={(e) => e.stopPropagation()}>{s.reference}</Link>
                    </td>
                    <td className="max-w-72 px-3 py-3.5">
                      <p className="truncate">{splitAddress(s.origin)[0]} <span className="text-faint">→</span> {splitAddress(s.destination)[0]}</p>
                      <p className="truncate text-xs text-muted">{s.distanceKm ? `${s.distanceKm} km` : 'Distance unknown'}</p>
                    </td>
                    {staff ? (
                      <td className="px-3 py-3.5">
                        <span className="flex items-center gap-2"><Avatar name={s.customerName} size="xs" />{s.customerName || '—'}</span>
                      </td>
                    ) : null}
                    <td className="px-3 py-3.5 text-muted">{s.driverName ?? <span className="text-faint">Unassigned</span>}</td>
                    <td className="px-3 py-3.5"><StatusBadge status={s.status} size="sm" /></td>
                    <td className="px-3 py-3.5 text-right font-medium tabular-nums">{formatKobo(s.priceKobo)}</td>
                    <td className="px-5 py-3.5 text-right text-muted">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {rows.length ? <p className="text-xs text-faint">{rows.length} order{rows.length === 1 ? '' : 's'}</p> : null}
    </PageContainer>
  );
}
