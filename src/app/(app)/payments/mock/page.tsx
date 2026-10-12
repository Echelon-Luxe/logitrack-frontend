import { Suspense } from 'react';
import type { Metadata } from 'next';
import { MockCheckout } from './mock-checkout';

export const metadata: Metadata = { title: 'Checkout' };

export default function MockCheckoutPage() {
  return <Suspense><MockCheckout /></Suspense>;
}
