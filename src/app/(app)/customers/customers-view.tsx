'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Phone, Search, Users } from 'lucide-react';
import { useShipments, useUsers } from '@/hooks/queries';
import { PageContainer } from '@/components/app-shell';
import { RequireCapability } from '@/components/require-role';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { formatKobo, type User } from '@/lib/types';
import { formatDate, telHref } from '@/lib/format';

export function CustomersView() {
  return <RequireCapability cap="customers.read"><Customers /></RequireCapability>;
}

function Customers() {
  const params = useSearchParams();
  const [query, setQuery] = React.useState(params.get('q') ?? '');
  const [q, setQ] = React.useState(query);
  const [open, setOpen] = React.useState<User | null>(null);
  React.useEffect(() => { const t = setTimeout(() => setQ(query.trim()), 250); return () => clearTimeout(t); }, [query]);

  const customers = useUsers({ role: 'CUSTOMER', q: q || undefined, limit: 200 });
  // One fetch of recent shipments gives per-customer counts without N calls.
  const shipments = useShipments({ limit: 200 });
  const stats = React.useMemo(() => {
    const m = new Map<string, { count: number; active: number; spend: number; last: string | null }>();
    for (const s of shipments.data ?? []) {
      const e = m.get(s.customerId) ?? { count: 0, active: 0, spend: 0, last: null };
      e.count += 1;
      if (s.status !== 'DELIVERED' && s.status !== 'CANCELLED') e.active += 1;
      if (s.status !== 'CANCELLED') e.spend += s.priceKobo;
      if (!e.last || s.createdAt > e.last) e.last = s.createdAt;
      m.set(s.customerId, e);
    }
    return m;
  }, [shipments.data]);

  return (
    <PageContainer>
      <PageHeader title="Customers" description={`${customers.data?.total ?? '…'} customer accounts`} />
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or phone" className="pl-9" aria-label="Search customers" />
      </div>

      {customers.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}</div>
      ) : !customers.data?.items.length ? (
        <EmptyState icon={Users} title="No customers found" description="Try a different search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {customers.data.items.map((c) => {
            const st = stats.get(c.id);
            return (
              <button key={c.id} type="button" onClick={() => setOpen(c)} className="cursor-pointer rounded-3xl border border-line bg-surface p-5 text-left shadow-[var(--shadow-card)] transition hover:border-line-strong">
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted">{c.email}</p>
                  </div>
                  {!c.active ? <Badge tone="rose" size="sm">Disabled</Badge> : null}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-surface-2 py-2"><p className="font-semibold tabular-nums">{st?.count ?? 0}</p><p className="text-[11px] text-muted">Orders</p></div>
                  <div className="rounded-2xl bg-surface-2 py-2"><p className="font-semibold tabular-nums">{st?.active ?? 0}</p><p className="text-[11px] text-muted">Active</p></div>
                  <div className="rounded-2xl bg-surface-2 py-2"><p className="font-semibold tabular-nums">{formatKobo(st?.spend ?? 0)}</p><p className="text-[11px] text-muted">Booked</p></div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => { if (!o) setOpen(null); }}>
        {open ? <CustomerSheet customer={open} /> : null}
      </Dialog>
    </PageContainer>
  );
}

function CustomerSheet({ customer: c }: { customer: User }) {
  const all = useShipments({ q: c.email, limit: 100 });
  // q matches the snapshot email too; filter to be exact.
  const rows = (all.data ?? []).filter((s) => s.customerId === c.id);
  return (
    <DialogContent side="right" title={c.name} description={`Customer since ${formatDate(c.createdAt)}`}>
      <div className="flex flex-wrap gap-2">
        <a href={`mailto:${c.email}`} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-3"><Mail className="size-4" />{c.email}</a>
        {c.phone ? <a href={telHref(c.phone)} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:bg-surface-3"><Phone className="size-4" />{c.phone}</a> : null}
      </div>
      <h3 className="mt-6 mb-2 text-sm font-semibold">Orders</h3>
      {all.isLoading ? <Skeleton className="h-32" /> : rows.length === 0 ? <p className="text-sm text-muted">No orders yet.</p> : (
        <ul className="space-y-2">
          {rows.map((s) => (
            <li key={s.id}>
              <Link href={`/shipments/${s.id}`} className="flex items-center gap-3 rounded-2xl border border-line p-3 hover:bg-surface-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{s.reference} <span className="font-normal text-muted">· {formatKobo(s.priceKobo)}</span></p>
                  <p className="truncate text-xs text-muted">{s.origin} → {s.destination}</p>
                </div>
                <StatusBadge status={s.status} size="sm" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DialogContent>
  );
}
