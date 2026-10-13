'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import * as D from '@radix-ui/react-dialog';
import { Package, Search, User as UserIcon, CornerDownLeft, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { can } from '@/lib/rbac';
import { StatusBadge } from '@/components/status-badge';
import { NAV_ADMIN, NAV_FOOTER, NAV_MAIN, visibleFor } from '@/components/nav';
import { ROLE_LABEL } from '@/lib/types';

const useDebounced = <T,>(v: T, ms: number): T => {
  const [d, setD] = React.useState(v);
  React.useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
};

/** ⌘K: jump to a page, a shipment (by reference, address or person) or a user. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = React.useState('');
  const q = useDebounced(query.trim(), 200);

  const shipments = useQuery({
    queryKey: ['palette', 'shipments', q],
    queryFn: () => api.shipments.list({ q, limit: 8 }),
    enabled: open && q.length >= 2,
  });
  const people = useQuery({
    queryKey: ['palette', 'users', q],
    queryFn: () => api.users.list({ q, limit: 6 }),
    enabled: open && q.length >= 2 && can(user?.role, 'users.read'),
  });

  if (!user) return null;
  const change = (o: boolean) => { if (!o) setQuery(''); onOpenChange(o); };
  const go = (href: string) => { change(false); router.push(href); };
  const pages = [...visibleFor(NAV_MAIN, user.role), ...visibleFor(NAV_ADMIN, user.role), ...visibleFor(NAV_FOOTER, user.role)];

  const item = 'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg data-[selected=true]:bg-surface-3 aria-selected:bg-surface-3';
  const group = '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-faint [&_[cmdk-group-heading]]:uppercase';

  return (
    <D.Root open={open} onOpenChange={change}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-[2px]" />
        <D.Content className="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-pop)] focus:outline-none">
          <D.Title className="sr-only">Search</D.Title>
          <D.Description className="sr-only">Search shipments, people and pages</D.Description>
          <Command shouldFilter={false} loop className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 text-muted" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search shipments, customers, pages…"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
              />
              <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[11px] text-muted">esc</kbd>
            </div>
            <Command.List className="scroll-thin max-h-[60vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-10 text-center text-sm text-muted">
                {q.length < 2 ? 'Type at least two characters' : shipments.isFetching ? 'Searching…' : 'No matches'}
              </Command.Empty>

              {shipments.data?.length ? (
                <Command.Group heading="Shipments" className={group}>
                  {shipments.data.map((s) => (
                    <Command.Item key={s.id} value={`s-${s.id}`} onSelect={() => go(`/shipments/${s.id}`)} className={item}>
                      <Package className="size-4 text-muted" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{s.reference}</p>
                        <p className="truncate text-xs text-muted">{s.origin} → {s.destination}</p>
                      </div>
                      <StatusBadge status={s.status} size="sm" />
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}

              {people.data?.items.length ? (
                <Command.Group heading="People" className={group}>
                  {people.data.items.map((u) => (
                    <Command.Item
                      key={u.id}
                      value={`u-${u.id}`}
                      onSelect={() => go(can(user.role, 'users.manage') ? `/admin/users?q=${encodeURIComponent(u.email)}` : `/customers?q=${encodeURIComponent(u.email)}`)}
                      className={item}
                    >
                      <UserIcon className="size-4 text-muted" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{u.name}</p>
                        <p className="truncate text-xs text-muted">{u.email}</p>
                      </div>
                      <span className="text-xs text-muted">{ROLE_LABEL[u.role]}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}

              {q.length < 2 ? (
                <>
                  <Command.Group heading="Go to" className={group}>
                    {pages.map((p) => (
                      <Command.Item key={p.href} value={p.href} onSelect={() => go(p.href)} className={item}>
                        <p.icon className="size-4 text-muted" />
                        <span className="flex-1">{p.label}</span>
                        <CornerDownLeft className="size-3.5 text-faint" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                  <Command.Group heading="Actions" className={group}>
                    {can(user.role, 'shipment.create') ? (
                      <Command.Item value="new" onSelect={() => go('/shipments/new')} className={item}>
                        <Plus className="size-4 text-muted" /> New shipment
                      </Command.Item>
                    ) : null}
                  </Command.Group>
                </>
              ) : null}
            </Command.List>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
