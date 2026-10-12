'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { bearing, fetchRoute, nearestIndex, resample, type LatLng } from '@/lib/geo';
import { errorMessage } from '@/hooks/queries';

export type ReporterMode = 'off' | 'gps' | 'sim';

const GPS_MIN_INTERVAL_MS = 5_000;
const SIM_TICK_MS = 1_500;
// Accelerated so a cross-town trip plays out in a couple of minutes.
const SIM_STEP_KM = 0.18;

/**
 * Sends the driver's position for a shipment - from the device's GPS, or by
 * driving the road route in a simulator for local demos. One mode at a time.
 */
export function useLocationReporter(shipmentId: string | null, from: LatLng | null, to: LatLng | null, lastKnown: LatLng | null) {
  // Keyed by shipment, so a finished or switched job stops reporting by itself.
  const [state, setState] = React.useState<{ id: string | null; mode: ReporterMode; sent: number }>({ id: null, mode: 'off', sent: 0 });
  const mode: ReporterMode = state.id === shipmentId ? state.mode : 'off';
  const sent = state.id === shipmentId ? state.sent : 0;

  const setMode = React.useCallback((m: ReporterMode) => {
    if (m === 'gps' && !('geolocation' in navigator)) {
      toast.error('This device has no location service');
      return;
    }
    if (m === 'sim' && (!from || !to)) {
      toast.error('This shipment has no coordinates to simulate');
      return;
    }
    setState((s) => ({ id: shipmentId, mode: m, sent: s.id === shipmentId ? s.sent : 0 }));
  }, [shipmentId, from, to]);
  const lastRef = React.useRef(lastKnown);
  React.useEffect(() => { lastRef.current = lastKnown; }, [lastKnown]);

  React.useEffect(() => {
    if (!shipmentId || mode === 'off') return;
    let stopped = false;

    const send = async (p: LatLng, extra: { heading?: number; speedKph?: number; accuracyM?: number }) => {
      try {
        await api.tracking.report(shipmentId, { lat: p[0], lng: p[1], ...extra });
        setState((s) => ({ ...s, sent: s.sent + 1 }));
      } catch (e) {
        toast.error(`Location not sent: ${errorMessage(e)}`);
        setMode('off');
      }
    };

    if (mode === 'gps') {
      let lastSent = 0;
      const watch = navigator.geolocation.watchPosition(
        (pos) => {
          if (Date.now() - lastSent < GPS_MIN_INTERVAL_MS) return;
          lastSent = Date.now();
          void send([pos.coords.latitude, pos.coords.longitude], {
            ...(pos.coords.heading !== null && !Number.isNaN(pos.coords.heading) ? { heading: pos.coords.heading } : {}),
            ...(pos.coords.speed !== null ? { speedKph: Math.max(0, pos.coords.speed * 3.6) } : {}),
            accuracyM: Math.min(10_000, pos.coords.accuracy),
          });
        },
        (err) => {
          toast.error(err.code === err.PERMISSION_DENIED ? 'Location permission was denied' : 'Could not read your location');
          setMode('off');
        },
        { enableHighAccuracy: true, maximumAge: 2_000, timeout: 20_000 },
      );
      return () => navigator.geolocation.clearWatch(watch);
    }

    // Simulator: continue from the last reported point along the road route.
    if (!from || !to) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    void fetchRoute(from, to).then((route) => {
      if (stopped) return;
      const path = resample(route, SIM_STEP_KM);
      let i = lastRef.current ? nearestIndex(path, lastRef.current) : 0;
      const tick = () => {
        if (stopped) return;
        if (i >= path.length - 1) {
          toast.success('Arrived at the dropoff — mark it delivered when handed over');
          setMode('off');
          return;
        }
        const a = path[i]!;
        const b = path[i + 1]!;
        void send(b, { heading: bearing(a, b), speedKph: 28 + Math.round(Math.random() * 18) });
        i += 1;
        timer = setTimeout(tick, SIM_TICK_MS);
      };
      tick();
    });
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [mode, shipmentId, from, to, setMode]);

  return { mode, setMode, sent };
}
