'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { openStream } from '@/lib/api';
import { qk } from '@/hooks/queries';
import type { LocationPoint } from '@/lib/types';

export interface LiveState {
  location: LocationPoint | null;
  status: string | null;
  connected: boolean;
}

/**
 * Subscribes to a shipment's live stream: a snapshot first, then location and
 * status events. Reconnects with backoff, and invalidates the shipment queries
 * on a status change so every panel showing it updates together.
 */
export function useLiveTracking(shipmentId: string | null | undefined, enabled = true): LiveState {
  const qc = useQueryClient();
  // Keyed by shipment: switching shipments shows the empty state immediately
  // instead of the previous shipment's truck.
  const [state, setState] = React.useState<LiveState & { id: string | null }>({ id: null, location: null, status: null, connected: false });

  React.useEffect(() => {
    if (!shipmentId || !enabled) return;
    const id = shipmentId;

    const ctl = new AbortController();
    let attempt = 0;

    const run = async () => {
      while (!ctl.signal.aborted) {
        try {
          await openStream(`/tracking/${shipmentId}/stream`, (event, data) => {
            attempt = 0;
            if (event === 'snapshot') {
              const d = data as { status: string | null; location: LocationPoint | null };
              setState({ id, location: d.location, status: d.status, connected: true });
            } else if (event === 'location') {
              setState((s) => ({ ...s, id, location: data as LocationPoint, connected: true }));
              qc.setQueryData<LocationPoint[]>(qk.trail(shipmentId), (old) => (old ? [...old, data as LocationPoint] : old));
            } else if (event === 'status') {
              const d = data as { status: string };
              setState((s) => ({ ...s, id, status: d.status }));
              void qc.invalidateQueries({ queryKey: qk.shipment(shipmentId) });
              void qc.invalidateQueries({ queryKey: qk.timeline(shipmentId) });
              void qc.invalidateQueries({ queryKey: ['shipments'] });
            }
          }, ctl.signal);
        } catch {
          /* fall through to backoff */
        }
        if (ctl.signal.aborted) return;
        setState((s) => ({ ...s, connected: false }));
        attempt += 1;
        await new Promise((r) => setTimeout(r, Math.min(15_000, 1000 * 2 ** attempt)));
      }
    };
    void run();
    return () => ctl.abort();
  }, [shipmentId, enabled, qc]);

  if (!shipmentId || !enabled || state.id !== shipmentId) return { location: null, status: null, connected: false };
  return { location: state.location, status: state.status, connected: state.connected };
}
