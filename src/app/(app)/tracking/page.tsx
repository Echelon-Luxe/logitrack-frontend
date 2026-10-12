import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TrackingView } from './tracking-view';

export const metadata: Metadata = { title: 'Tracking' };

// useSearchParams (the selected shipment lives in ?id=) needs a Suspense
// boundary, or the whole route renders client-side.
export default function TrackingPage() {
  return (
    <Suspense>
      <TrackingView />
    </Suspense>
  );
}
