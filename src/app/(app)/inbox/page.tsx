'use client';

import * as React from 'react';
import Link from 'next/link';
import { BellOff, CheckCheck, CheckCircle2, Inbox as InboxIcon, Package, Truck, XCircle, UserCheck } from 'lucide-react';
import { useInbox, useMarkAllRead, useMarkRead } from '@/hooks/queries';
import { PageContainer } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';

const ICON: Record<string, { icon: React.ElementType; tone: string }> = {
  'shipment.created': { icon: Package, tone: 'bg-amber-500/12 text-amber-600' },
  'shipment.assigned': { icon: UserCheck, tone: 'bg-sky-500/12 text-sky-600' },
  'shipment.out_for_delivery': { icon: Truck, tone: 'bg-teal-500/12 text-teal-600' },
  'shipment.delivered': { icon: CheckCircle2, tone: 'bg-emerald-500/12 text-emerald-600' },
  'shipment.cancelled': { icon: XCircle, tone: 'bg-rose-500/12 text-rose-600' },
};

// Today / Yesterday / Earlier keeps a long inbox scannable.
const bucket = (iso: string): string => {
  const d = new Date(iso);
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (d.getTime() >= start) return 'Today';
  if (d.getTime() >= start - 86_400_000) return 'Yesterday';
  return 'Earlier';
};

export default function InboxPage() {
  const inbox = useInbox();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  const items = (inbox.data ?? []).filter((n) => filter === 'all' || !n.readAt);
  const unread = (inbox.data ?? []).filter((n) => !n.readAt).length;
  const groups = items.reduce<Record<string, Notification[]>>((acc, n) => {
    (acc[bucket(n.createdAt)] ??= []).push(n);
    return acc;
  }, {});

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Inbox"
        description={unread ? `${unread} unread update${unread === 1 ? '' : 's'}` : "You're all caught up."}
        actions={<Button variant="secondary" onClick={() => markAll.mutate()} disabled={!unread} loading={markAll.isPending}><CheckCheck />Mark all read</Button>}
      />
      <Segmented value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All', count: inbox.data?.length ?? 0 }, { value: 'unread', label: 'Unread', count: unread }]} className="w-fit" />

      {inbox.isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={filter === 'unread' ? BellOff : InboxIcon} title={filter === 'unread' ? 'No unread updates' : 'No notifications yet'} description="Updates about your shipments land here as they happen." />
      ) : (
        (['Today', 'Yesterday', 'Earlier'] as const).filter((g) => groups[g]?.length).map((g) => (
          <section key={g} className="space-y-2">
            <h2 className="px-1 text-xs font-semibold tracking-wide text-faint uppercase">{g}</h2>
            <ul className="overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]">
              {groups[g]!.map((n) => {
                const meta = ICON[n.eventType] ?? { icon: Package, tone: 'bg-surface-3 text-muted' };
                return (
                  <li key={n.id} className="border-b border-line last:border-0">
                    <Link
                      href={`/shipments/${n.shipmentId}`}
                      onClick={() => { if (!n.readAt) markRead.mutate(n.id); }}
                      className={cn('flex gap-4 px-4 py-4 transition hover:bg-surface-2', !n.readAt && 'bg-surface-2')}
                    >
                      <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', meta.tone)}><meta.icon className="size-[18px]" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className={cn('text-sm', n.readAt ? 'font-medium' : 'font-semibold')}>{n.subject}</p>
                          <span className="shrink-0 text-xs text-faint">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-[13px] text-muted">{n.body}</p>
                      </div>
                      {!n.readAt ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" /> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </PageContainer>
  );
}
