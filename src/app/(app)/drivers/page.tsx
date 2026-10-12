import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FleetView } from './fleet-view';

export const metadata: Metadata = { title: 'Fleet' };

export default function DriversPage() {
  return <Suspense><FleetView /></Suspense>;
}
