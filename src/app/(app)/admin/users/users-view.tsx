'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Copy, KeyRound, LogOut, Search, ShieldCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateUser, useUserSummary, useUsers, errorMessage } from '@/hooks/queries';
import { api } from '@/lib/api';
import { CAPABILITIES } from '@/lib/rbac';
import { ROLES, ROLE_LABEL, type Role, type User } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { PageContainer } from '@/components/app-shell';
import { RequireCapability } from '@/components/require-role';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EmptyState } from '@/components/empty-state';

const ROLE_PLURAL: Record<Role, string> = {
  ADMIN: 'Admins', DISPATCHER: 'Dispatchers', SUPPORT: 'Support', DRIVER: 'Drivers', CUSTOMER: 'Customers',
};

export const ROLE_TONE: Record<Role, BadgeTone> = {
  ADMIN: 'rose', DISPATCHER: 'violet', SUPPORT: 'sky', DRIVER: 'teal', CUSTOMER: 'neutral',
};

const CAP_LABEL: Partial<Record<keyof typeof CAPABILITIES, string>> = {
  'shipment.readAll': 'See every shipment',
  'shipment.create': 'Book shipments',
  'shipment.assign': 'Assign drivers',
  'shipment.cancelAny': 'Cancel any shipment',
  'drivers.approve': 'Approve drivers',
  'location.report': 'Share live location',
  'payments.pay': 'Pay for shipments',
  'payments.readAll': 'See all payments',
  'users.read': 'View user directory',
  'users.manage': 'Manage users & roles',
  'audit.read': 'Read the audit log',
};

export function UsersView() {
  return <RequireCapability cap="users.manage"><Users /></RequireCapability>;
}

function Users() {
  const { user: me } = useAuth();
  const params = useSearchParams();
  const [query, setQuery] = React.useState(params.get('q') ?? '');
  const [q, setQ] = React.useState(query);
  const [role, setRole] = React.useState<Role | 'ALL'>('ALL');
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [matrixOpen, setMatrixOpen] = React.useState(false);
  const [reset, setReset] = React.useState<{ name: string; password: string } | null>(null);
  React.useEffect(() => { const t = setTimeout(() => setQ(query.trim()), 250); return () => clearTimeout(t); }, [query]);

  const users = useUsers({ q: q || undefined, ...(role !== 'ALL' ? { role } : {}), limit: 200 });
  const summary = useUserSummary();
  const update = useUpdateUser();
  const qc = useQueryClient();

  const revoke = async (u: User) => {
    try {
      const r = await api.users.revokeSessions(u.id);
      toast.success(`${u.name} signed out of ${r.revoked} session${r.revoked === 1 ? '' : 's'}`);
      void qc.invalidateQueries({ queryKey: ['audit'] });
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const resetPassword = async (u: User) => {
    if (!window.confirm(`Reset ${u.name}'s password? They will be signed out and need the temporary password to sign in.`)) return;
    try {
      const r = await api.users.resetPassword(u.id);
      setReset({ name: u.name, password: r.temporaryPassword });
      void qc.invalidateQueries({ queryKey: ['audit'] });
    } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Users & roles"
        description="Who can sign in, and what each person is allowed to do."
        actions={
          <>
            <Button variant="secondary" onClick={() => setMatrixOpen(true)}><ShieldCheck />Permissions</Button>
            <Button onClick={() => setInviteOpen(true)}><UserPlus />Add user</Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Role | 'ALL'>
          size="sm"
          value={role}
          onChange={setRole}
          options={[{ value: 'ALL', label: 'All' }, ...ROLES.map((r) => ({ value: r, label: ROLE_PLURAL[r], count: summary.data?.[r] }))]}
        />
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone" className="pl-9" aria-label="Search users" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]">
        {users.isLoading ? <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div> : !users.data?.items.length ? (
          <div className="p-6"><EmptyState icon={Search} title="No users found" description="Try a different role or search." /></div>
        ) : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.data.items.map((u) => {
                  const self = u.id === me?.id;
                  return (
                    <tr key={u.id} className={u.active ? '' : 'opacity-60'}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium">{u.name}{self ? <span className="ml-1.5 text-xs text-faint">(you)</span> : null}</p>
                            <p className="truncate text-xs text-muted">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="w-40">
                          <Select
                            value={u.role}
                            disabled={self || update.isPending}
                            aria-label={`Role for ${u.name}`}
                            className="h-8 text-[13px]"
                            onChange={(e) => {
                              const next = e.target.value as Role;
                              if (window.confirm(`Change ${u.name} from ${ROLE_LABEL[u.role]} to ${ROLE_LABEL[next]}? They will be signed out everywhere.`)) {
                                update.mutate({ id: u.id, role: next });
                              }
                            }}
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                          </Select>
                        </div>
                      </td>
                      <td className="px-3 py-3">{u.active ? <Badge tone="green" dot size="sm">Active</Badge> : <Badge tone="rose" dot size="sm">Disabled</Badge>}</td>
                      <td className="px-3 py-3 text-muted">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="xs" variant="ghost" onClick={() => void resetPassword(u)} title="Issue a temporary password"><KeyRound />Reset</Button>
                          <Button size="xs" variant="ghost" onClick={() => void revoke(u)} title="Sign out everywhere"><LogOut />Sessions</Button>
                          <Button
                            size="xs"
                            variant={u.active ? 'danger-soft' : 'soft'}
                            disabled={self}
                            onClick={() => {
                              if (!u.active || window.confirm(`Disable ${u.name}? They will be signed out and unable to sign in.`)) update.mutate({ id: u.id, active: !u.active });
                            }}
                          >{u.active ? 'Disable' : 'Enable'}</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Keyed so each opening starts from a blank form. */}
      <InviteDialog key={inviteOpen ? 'open' : 'closed'} open={inviteOpen} onOpenChange={setInviteOpen} />
      <Dialog open={!!reset} onOpenChange={(o) => { if (!o) setReset(null); }}>
        <DialogContent title="Temporary password" description={reset ? `For ${reset.name}. Shown once - share it securely.` : undefined}>
          {reset ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-sm">{reset.password}</code>
                <Button size="icon-sm" variant="secondary" onClick={() => { void navigator.clipboard.writeText(reset.password); toast.success('Copied'); }} aria-label="Copy password"><Copy /></Button>
              </div>
              <p className="text-[13px] text-muted">They should change it in Settings after signing in.</p>
              <Button className="w-full" onClick={() => setReset(null)}>Done</Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={matrixOpen} onOpenChange={setMatrixOpen}>
        <DialogContent title="Permission matrix" description="What each role can do. Enforced by every service, mirrored here." className="max-w-2xl">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-medium">Capability</th>
                  {ROLES.map((r) => <th key={r} className="px-2 py-2 text-center font-medium">{ROLE_LABEL[r]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(Object.keys(CAP_LABEL) as (keyof typeof CAPABILITIES)[]).map((cap) => (
                  <tr key={cap}>
                    <td className="py-2 pr-3">{CAP_LABEL[cap]}</td>
                    {ROLES.map((r) => (
                      <td key={r} className="px-2 py-2 text-center">
                        {(CAPABILITIES[cap] as readonly Role[]).includes(r)
                          ? <span className="inline-grid size-5 place-items-center rounded-full bg-emerald-500/15 text-emerald-600" aria-label="Allowed">✓</span>
                          : <span className="text-faint" aria-label="Not allowed">–</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-muted">Ownership still applies: customers only see their own shipments, drivers only their assigned jobs.</p>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', role: 'DISPATCHER' as Role });
  const [busy, setBusy] = React.useState(false);
  const [temp, setTemp] = React.useState<string | null>(null);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.users.create({ name: form.name, email: form.email, role: form.role, ...(form.phone ? { phone: form.phone } : {}) });
      setTemp(r.temporaryPassword ?? null);
      toast.success(`${r.user.name} added as ${ROLE_LABEL[r.user.role]}`);
      void qc.invalidateQueries({ queryKey: ['users'] });
      void qc.invalidateQueries({ queryKey: ['audit'] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add a user" description="Staff accounts can only be created here - never by self sign-up.">
        {temp ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold"><KeyRound className="size-4" />Temporary password</p>
              <p className="mt-1 text-xs text-muted">Shown once. Share it securely; they should change it in Settings after signing in.</p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-surface px-3 py-2 font-mono text-sm">{temp}</code>
                <Button size="icon-sm" variant="secondary" onClick={() => { void navigator.clipboard.writeText(temp); toast.success('Copied'); }} aria-label="Copy password"><Copy /></Button>
              </div>
            </div>
            <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <Field label="Full name" htmlFor="inv-name"><Input id="inv-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email" htmlFor="inv-email"><Input id="inv-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Phone" htmlFor="inv-phone" hint="Optional"><Input id="inv-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Role" htmlFor="inv-role">
              <Select id="inv-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </Select>
            </Field>
            <Button type="submit" className="w-full" loading={busy}>Create account</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
