'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { LiveMapProps } from './live-map-inner';

export type { LiveMapProps, FleetDot } from './live-map-inner';

// Leaflet touches window at import time, so it can never render on the server.
export const LiveMap = dynamic<LiveMapProps>(() => import('./live-map-inner'), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});
