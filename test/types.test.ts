import { describe, it, expect } from 'vitest';
import { SHIPMENT_STATUSES, nextStatuses, isTerminal, STATUS_LABEL } from '@/lib/types';

// The UI greys out impossible actions without a round trip, so this table must
// agree with shipment-service. If they drift, users see buttons that 409.
describe('shipment transitions mirror the server', () => {
  it.each([
    ['CREATED', ['PICKED_UP', 'CANCELLED']],
    ['PICKED_UP', ['IN_TRANSIT', 'CANCELLED']],
    ['IN_TRANSIT', ['OUT_FOR_DELIVERY', 'CANCELLED']],
    ['OUT_FOR_DELIVERY', ['DELIVERED', 'CANCELLED']],
    ['DELIVERED', []],
    ['CANCELLED', []],
  ] as const)('%s offers %j', (from, expected) => {
    expect([...nextStatuses(from)]).toEqual([...expected]);
  });

  it('treats DELIVERED and CANCELLED as terminal', () => {
    expect(isTerminal('DELIVERED')).toBe(true);
    expect(isTerminal('CANCELLED')).toBe(true);
  });

  it('never offers a status as its own successor', () => {
    for (const s of SHIPMENT_STATUSES) expect(nextStatuses(s)).not.toContain(s);
  });

  it('labels every status, so the UI never renders a raw enum', () => {
    for (const s of SHIPMENT_STATUSES) {
      expect(STATUS_LABEL[s]).toBeTruthy();
      expect(STATUS_LABEL[s]).not.toBe(s);
    }
  });
});
