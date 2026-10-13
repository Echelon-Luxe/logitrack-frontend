'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Lock, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { errorMessage } from '@/hooks/queries';
import { formatKobo } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Local stand-in for the Paystack checkout (PAYMENT_PROVIDER=mock). Clearly
 * labelled as a test: it settles through the payment service's real
 * settlement path, so badges, events and driver earnings behave as in prod.
 */
export function MockCheckout() {
  const ref = useSearchParams().get('reference') ?? '';
  const router = useRouter();
  const qc = useQueryClient();
  const [busy, setBusy] = React.useState<'ok' | 'fail' | null>(null);
  const payment = useQuery({ queryKey: ['payment', ref], queryFn: () => api.payments.get(ref), enabled: !!ref });

  const complete = async (succeeded: boolean) => {
    setBusy(succeeded ? 'ok' : 'fail');
    try {
      const p = await api.payments.mockComplete(ref, succeeded);
      await qc.invalidateQueries({ queryKey: ['payments'] });
      if (succeeded) toast.success('Payment successful'); else toast.error('Payment declined');
      router.replace(`/shipments/${p.shipmentId}`);
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-md p-6 pt-16">
      <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700">
        <FlaskConical className="size-3.5" />Test checkout - no real money moves
      </div>
      <Card>
        <CardContent className="space-y-5 pt-6 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-lg border border-line text-muted"><CreditCard className="size-5" /></span>
          {payment.isLoading ? <Skeleton className="mx-auto h-10 w-40" /> : payment.data ? (
            <div>
              <p className="text-sm text-muted">Amount due</p>
              <p className="text-4xl font-semibold tracking-tight tabular-nums">{formatKobo(payment.data.amount, payment.data.currency)}</p>
              <p className="mt-1 font-mono text-xs text-faint">{payment.data.reference}</p>
            </div>
          ) : <p className="text-sm text-rose-600">{payment.error ? errorMessage(payment.error) : 'Missing payment reference'}</p>}
          {payment.data?.status === 'PENDING' ? (
            <div className="space-y-2">
              <Button size="lg" className="w-full" loading={busy === 'ok'} disabled={!!busy} onClick={() => void complete(true)}><Lock />Pay {formatKobo(payment.data.amount)}</Button>
              <Button variant="ghost" className="w-full" loading={busy === 'fail'} disabled={!!busy} onClick={() => void complete(false)}>Simulate a declined card</Button>
            </div>
          ) : payment.data ? (
            <Button variant="secondary" className="w-full" onClick={() => router.replace(`/shipments/${payment.data!.shipmentId}`)}>This payment is {payment.data.status.toLowerCase()} · back to shipment</Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
