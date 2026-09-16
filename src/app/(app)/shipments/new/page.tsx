'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Field } from '@/components/ui/input';

export default function NewShipmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      const s = await api.shipments.create({
        customerId: user.id,
        origin: String(f.get('origin')),
        destination: String(f.get('destination')),
      });
      router.push(`/shipments/${s.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the shipment.');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5 animate-fade-up">
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href="/shipments"><ArrowLeft className="size-4" />Shipments</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New shipment</CardTitle>
          <CardDescription>
            A reference is generated automatically and the shipment starts as Created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label="Origin" htmlFor="origin">
              <Input id="origin" name="origin" required maxLength={200} placeholder="London" />
            </Field>
            <Field label="Destination" htmlFor="destination">
              <Input id="destination" name="destination" required maxLength={200} placeholder="Manchester" />
            </Field>

            {error && (
              <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="mt-1 flex gap-2">
              <Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create shipment'}</Button>
              <Button asChild type="button" variant="secondary"><Link href="/shipments">Cancel</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
