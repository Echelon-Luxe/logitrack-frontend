import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OrdersView } from './orders-view';

export const metadata: Metadata = { title: 'Orders' };

export default function OrdersPage() {
  return <Suspense><OrdersView /></Suspense>;
}
