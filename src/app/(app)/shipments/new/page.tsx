'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpDown, Info, Route, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useCreateShipment, useUsers } from '@/hooks/queries';
import { api } from '@/lib/api';
import { can } from '@/lib/rbac';
import { formatKobo } from '@/lib/types';
import { PageContainer } from '@/components/app-shell';
import { RequireCapability } from '@/components/require-role';
import { AddressAutocomplete, type Place } from '@/components/address-autocomplete';
import { LiveMap } from '@/components/live-map';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';

export default function NewShipmentPage() {
  return (
    <RequireCapability cap="shipment.create">
      <NewShipmentForm />
    </RequireCapability>
  );
}

function NewShipmentForm() {
  const { user } = useAuth();
  const router = useRouter();
  const create = useCreateShipment();
  const onBehalf = can(user?.role, 'shipment.createForCustomer');
  const customers = useUsers({ role: 'CUSTOMER', active: true, limit: 200 }, onBehalf);

  const [from, setFrom] = React.useState<Place | null>(null);
  const [to, setTo] = React.useState<Place | null>(null);
  const [notes, setNotes] = React.useState('');
  const [phone, setPhone] = React.useState(user?.phone ?? '');
  const [customerId, setCustomerId] = React.useState('');

  const quote = useQuery({
    queryKey: ['quote', from?.lat, from?.lng, to?.lat, to?.lng],
    queryFn: () => api.shipments.quote({ originLat: from!.lat, originLng: from!.lng, destLat: to!.lat, destLng: to!.lng }),
    enabled: !!from && !!to,
  });

  if (!user) return null;
  const customer = customers.data?.items.find((c) => c.id === customerId);
  const ready = !!from && !!to && (!onBehalf || !!customerId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return;
    create.mutate(
      {
        origin: from.label,
        destination: to.label,
        originLat: from.lat,
        originLng: from.lng,
        destLat: to.lat,
        destLng: to.lng,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(onBehalf && customer
          ? { customerId: customer.id, customerName: customer.name, customerEmail: customer.email, ...(customer.phone ? { customerPhone: customer.phone } : {}) }
          : phone.trim() ? { customerPhone: phone.trim() } : {}),
      },
      { onSuccess: (s) => router.push(`/shipments/${s.id}`) },
    );
  };

  return (
    <PageContainer className="max-w-6xl">
      <div>
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" />Orders</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New shipment</h1>
        <p className="mt-1 text-sm text-muted">Where should we collect it, and where is it going?</p>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          {onBehalf ? (
            <Card>
              <CardHeader><div><CardTitle>Customer</CardTitle><CardDescription>Booking on behalf of a customer</CardDescription></div></CardHeader>
              <CardContent>
                <Field label="Customer" htmlFor="customer">
                  <Select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                    <option value="">Select a customer…</option>
                    {customers.data?.items.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}
                  </Select>
                </Field>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader><div><CardTitle>Route</CardTitle><CardDescription>Search an address or pick a popular place</CardDescription></div></CardHeader>
            <CardContent className="space-y-3">
              <Field label="Pickup" htmlFor="from">
                <AddressAutocomplete id="from" tone="pickup" value={from} onChange={setFrom} placeholder="Where do we collect it?" />
              </Field>
              <div className="flex justify-center">
                <Button type="button" variant="ghost" size="xs" onClick={() => { setFrom(to); setTo(from); }} disabled={!from && !to}>
                  <ArrowUpDown />Swap
                </Button>
              </div>
              <Field label="Dropoff" htmlFor="to">
                <AddressAutocomplete id="to" tone="dropoff" value={to} onChange={setTo} placeholder="Where is it going?" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><div><CardTitle>Details</CardTitle><CardDescription>Optional, but helps the driver</CardDescription></div></CardHeader>
            <CardContent className="space-y-4">
              {!onBehalf ? (
                <Field label="Contact phone" htmlFor="phone" hint="The driver calls this number on arrival">
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 …" />
                </Field>
              ) : null}
              <Field label="Notes for the driver" htmlFor="notes">
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Gate code, fragile items, who to ask for…" />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="overflow-hidden">
            <div className="h-80 border-b border-line">
              <LiveMap
                from={from ? [from.lat, from.lng] : null}
                to={to ? [to.lat, to.lng] : null}
                fitKey={`${from?.lat}-${to?.lat}`}
              />
            </div>
            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-line p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted"><Route className="size-3.5" />Distance</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{quote.data?.distanceKm != null ? `${quote.data.distanceKm} km` : '—'}</p>
                </div>
                <div className="rounded-lg border border-line p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted"><Wallet className="size-3.5" />Price</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{quote.data ? formatKobo(quote.data.priceKobo) : '—'}</p>
                </div>
              </div>
              <p className="flex gap-2 text-xs text-muted">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {user.role === 'CUSTOMER' ? 'You can pay now or later from the shipment page. The price is fixed when you book.' : 'The customer pays this from their shipment page.'}
              </p>
              <Button type="submit" size="lg" className="w-full" disabled={!ready} loading={create.isPending}>
                Book shipment{quote.data ? ` · ${formatKobo(quote.data.priceKobo)}` : ''}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </PageContainer>
  );
}
