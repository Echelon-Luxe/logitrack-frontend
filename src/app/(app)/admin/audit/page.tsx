'use client';

import * as React from 'react';
import { KeyRound, LogIn, Search, ShieldAlert, ShieldCheck, UserCog, UserPlus, UserX, ScrollText, LogOut, User as UserIcon } from 'lucide-react';
import { useAudit } from '@/hooks/queries';
import { PageContainer } from '@/components/app-shell';
import { RequireCapability } from '@/components/require-role';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state';
import { formatDateTime, timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AuditEntry } from '@/lib/types';

const META: Record<string, { icon: React.ElementType; tone: string; describe: (e: AuditEntry) => string }> = {
  'auth.login': { icon: LogIn, tone: 'bg-sky-500/12 text-sky-600', describe: () => 'signed in' },
  'auth.login_failed': { icon: ShieldAlert, tone: 'bg-rose-500/12 text-rose-600', describe: (e) => `failed to sign in${e.metadata?.['reason'] ? ` (${String(e.metadata['reason'])})` : ''}` },
  'auth.password_changed': { icon: KeyRound, tone: 'bg-amber-500/12 text-amber-600', describe: () => 'changed their password' },
  'user.registered': { icon: UserPlus, tone: 'bg-emerald-500/12 text-emerald-600', describe: (e) => `registered as ${String(e.metadata?.['role'] ?? '').toLowerCase()}` },
  'user.created': { icon: UserPlus, tone: 'bg-emerald-500/12 text-emerald-600', describe: (e) => `created ${String(e.metadata?.['email'])} as ${String(e.metadata?.['role'] ?? '').toLowerCase()}` },
  'user.role_changed': { icon: UserCog, tone: 'bg-violet-500/12 text-violet-600', describe: (e) => `changed ${String(e.metadata?.['email'])} from ${String(e.metadata?.['from']).toLowerCase()} to ${String(e.metadata?.['to']).toLowerCase()}` },
  'user.disabled': { icon: UserX, tone: 'bg-rose-500/12 text-rose-600', describe: (e) => `disabled ${String(e.metadata?.['email'])}` },
  'user.enabled': { icon: ShieldCheck, tone: 'bg-emerald-500/12 text-emerald-600', describe: (e) => `re-enabled ${String(e.metadata?.['email'])}` },
  'user.sessions_revoked': { icon: LogOut, tone: 'bg-amber-500/12 text-amber-600', describe: (e) => `signed ${String(e.metadata?.['email'])} out everywhere` },
  'user.password_reset': { icon: KeyRound, tone: 'bg-amber-500/12 text-amber-600', describe: (e) => `reset the password for ${String(e.metadata?.['email'])}` },
  'user.updated': { icon: UserIcon, tone: 'bg-surface-3 text-muted', describe: (e) => `updated ${String(e.metadata?.['email'])}` },
  'user.profile_updated': { icon: UserIcon, tone: 'bg-surface-3 text-muted', describe: () => 'updated their profile' },
};

type Filter = '' | 'auth' | 'user';

export default function AuditPage() {
  return <RequireCapability cap="audit.read"><Audit /></RequireCapability>;
}

function Audit() {
  const [filter, setFilter] = React.useState<Filter>('');
  const [query, setQuery] = React.useState('');
  const [q, setQ] = React.useState('');
  React.useEffect(() => { const t = setTimeout(() => setQ(query.trim()), 250); return () => clearTimeout(t); }, [query]);
  const audit = useAudit({ ...(filter ? { action: filter } : {}), ...(q ? { q } : {}) });

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title="Audit log" description="Append-only record of sign-ins and every change to accounts and roles." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<Filter> size="sm" value={filter} onChange={setFilter} options={[{ value: '', label: 'Everything' }, { value: 'auth', label: 'Sign-ins' }, { value: 'user', label: 'Account changes' }]} />
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actor or action" className="pl-9" aria-label="Search audit log" />
        </div>
      </div>
      <div className="rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]">
        {audit.isLoading ? <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div> : !audit.data?.items.length ? (
          <div className="p-6"><EmptyState icon={ScrollText} title="Nothing recorded" description="No entries match this filter." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {audit.data.items.map((e) => {
              const m = META[e.action] ?? { icon: ScrollText, tone: 'bg-surface-3 text-muted', describe: (x: AuditEntry) => x.action };
              return (
                <li key={e.id} className="flex items-start gap-4 px-5 py-3.5">
                  <span className={cn('mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl', m.tone)}><m.icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><span className="font-semibold">{e.actorEmail ?? 'Someone'}</span> <span className="text-muted">{m.describe(e)}</span></p>
                    <p className="mt-0.5 text-xs text-faint">{formatDateTime(e.createdAt)}{e.ip ? ` · ${e.ip}` : ''} · <code className="text-[11px]">{e.action}</code></p>
                  </div>
                  <span className="shrink-0 text-xs text-faint">{timeAgo(e.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
