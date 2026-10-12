'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { errorMessage } from '@/hooks/queries';
import { api } from '@/lib/api';
import { ROLE_LABEL } from '@/lib/types';
import { PageContainer } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const [name, setName] = React.useState(user?.name ?? '');
  const [phone, setPhone] = React.useState(user?.phone ?? '');
  const [saving, setSaving] = React.useState(false);
  const [pw, setPw] = React.useState({ current: '', next: '', confirm: '' });
  const [changing, setChanging] = React.useState(false);

  if (!user) return null;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      setUser(await api.auth.updateMe({ name: name.trim(), phone: phone.trim() || null }));
      toast.success('Profile saved');
    } catch (err) { toast.error(errorMessage(err)); } finally { setSaving(false); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) { toast.error('New passwords do not match'); return; }
    setChanging(true);
    try {
      await api.auth.changePassword(pw.current, pw.next);
      toast.success('Password changed. Please sign in again.');
      // Every session was revoked server-side, this one included.
      await logout();
    } catch (err) { toast.error(errorMessage(err)); } finally { setChanging(false); }
  };

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title="Settings" description="Your profile and password." />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
          <Badge tone="brand">{ROLE_LABEL[user.role]}</Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void saveProfile(e)} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name"><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} /></Field>
            <Field label="Phone" htmlFor="phone" hint="Used for call buttons on your shipments"><Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 …" /></Field>
            <div className="sm:col-span-2"><Button type="submit" loading={saving}>Save profile</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><CardTitle>Password</CardTitle><CardDescription>Changing it signs you out on every device</CardDescription></div></CardHeader>
        <CardContent>
          <form onSubmit={(e) => void changePassword(e)} className="grid gap-4 sm:grid-cols-3">
            <Field label="Current" htmlFor="pw-cur"><Input id="pw-cur" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></Field>
            <Field label="New" htmlFor="pw-new" hint="At least 12 characters"><Input id="pw-new" type="password" autoComplete="new-password" minLength={12} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></Field>
            <Field label="Confirm" htmlFor="pw-conf"><Input id="pw-conf" type="password" autoComplete="new-password" minLength={12} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required /></Field>
            <div className="sm:col-span-3"><Button type="submit" variant="secondary" loading={changing}>Change password</Button></div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
