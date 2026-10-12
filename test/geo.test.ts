import { describe, it, expect } from 'vitest';
import { resample, splitRoute, haversineKm, endpointsOf, type LatLng } from '@/lib/geo';

const A: LatLng = [6.5, 3.3];
const B: LatLng = [6.5, 3.4];

describe('geo helpers', () => {
  it('measures roughly 11 km per 0.1° of longitude near the equator', () => {
    expect(haversineKm(A, B)).toBeGreaterThan(10.5);
    expect(haversineKm(A, B)).toBeLessThan(11.5);
  });

  // The simulator moves one sample per tick, so even spacing = steady speed.
  it('resamples a route into evenly spaced points including both ends', () => {
    const pts = resample([A, B], 1);
    expect(pts[0]).toEqual(A);
    expect(pts.at(-1)).toEqual(B);
    expect(pts.length).toBeGreaterThanOrEqual(11);
  });

  it('splits the route at the vehicle so both halves meet there', () => {
    const route = resample([A, B], 1);
    const at: LatLng = [6.5, 3.35];
    const [done, ahead] = splitRoute(route, at);
    expect(done.at(-1)).toEqual(at);
    expect(ahead[0]).toEqual(at);
  });

  it('needs all four coordinates to draw a route', () => {
    expect(endpointsOf({ originLat: 1, originLng: 2, destLat: 3, destLng: null })).toBeNull();
    expect(endpointsOf({ originLat: 1, originLng: 2, destLat: 3, destLng: 4 })).toEqual({ from: [1, 2], to: [3, 4] });
  });
});
