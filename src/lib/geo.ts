export type LatLng = [number, number];

export interface Endpoints {
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
}

export const endpointsOf = (s: Endpoints): { from: LatLng; to: LatLng } | null =>
  s.originLat !== null && s.originLng !== null && s.destLat !== null && s.destLng !== null
    ? { from: [s.originLat, s.originLng], to: [s.destLat, s.destLng] }
    : null;

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bearing(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(rad(b[1] - a[1])) * Math.cos(rad(b[0]));
  const x = Math.cos(rad(a[0])) * Math.sin(rad(b[0])) - Math.sin(rad(a[0])) * Math.cos(rad(b[0])) * Math.cos(rad(b[1] - a[1]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Road routes from the public OSRM demo server: free and keyless, which suits
// local development. Production would point this at its own routing service.
const OSRM = process.env['NEXT_PUBLIC_OSRM_URL'] ?? 'https://router.project-osrm.org';
const routeCache = new Map<string, Promise<LatLng[]>>();

/**
 * The road path between two points, or a straight line when routing is
 * unavailable (offline, rate-limited). Cached per pair for the session.
 */
export function fetchRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  const key = `${from.join(',')}→${to.join(',')}`;
  let p = routeCache.get(key);
  if (!p) {
    p = (async () => {
      try {
        const url = `${OSRM}/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as { routes?: { geometry: { coordinates: [number, number][] } }[] };
        const coords = body.routes?.[0]?.geometry.coordinates;
        if (!coords?.length) throw new Error('no route');
        return coords.map(([lng, lat]) => [lat, lng] as LatLng);
      } catch {
        routeCache.delete(key); // try the network again next time
        return [from, to];
      }
    })();
    routeCache.set(key, p);
  }
  return p;
}

/** Index of the route vertex nearest to a point. */
export function nearestIndex(route: LatLng[], p: LatLng): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < route.length; i++) {
    const d = (route[i]![0] - p[0]) ** 2 + (route[i]![1] - p[1]) ** 2;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/** Splits a route at the vehicle's position: [travelled, ahead]. */
export function splitRoute(route: LatLng[], at: LatLng | null): [LatLng[], LatLng[]] {
  if (!at || route.length < 2) return [[], route];
  const i = nearestIndex(route, at);
  return [[...route.slice(0, i + 1), at], [at, ...route.slice(i + 1)]];
}

/**
 * Evenly spaced points along a route, `stepKm` apart - the simulator drives
 * these so the truck moves at a steady speed regardless of vertex density.
 */
export function resample(route: LatLng[], stepKm: number): LatLng[] {
  if (route.length < 2) return route;
  const out: LatLng[] = [route[0]!];
  let carry = 0;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1]!;
    const b = route[i]!;
    const seg = haversineKm(a, b);
    let d = stepKm - carry;
    while (d <= seg) {
      const t = d / seg;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      d += stepKm;
    }
    carry = seg - (d - stepKm);
  }
  out.push(route[route.length - 1]!);
  return out;
}

/** 0..1 progress of a status along the journey, for the card's progress rail. */
export const STATUS_PROGRESS: Record<string, number> = {
  CREATED: 0.04,
  PICKED_UP: 0.22,
  IN_TRANSIT: 0.55,
  OUT_FOR_DELIVERY: 0.82,
  DELIVERED: 1,
  CANCELLED: 0,
};
