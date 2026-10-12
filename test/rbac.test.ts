import { describe, it, expect } from 'vitest';
import { can, allowedStatusActions, homeFor, CAPABILITIES } from '@/lib/rbac';
import { ROLES, type Shipment } from '@/lib/types';

const ship = (over: Partial<Shipment> = {}) => ({
  status: 'CREATED' as Shipment['status'],
  customerId: 'cust-1',
  driverUserId: null as string | null,
  driverId: null as string | null,
  ...over,
});

// The UI hides what a role cannot do; the services enforce it. These pin the
// UI mirror to the server rules in shipment-service/src/domain/access.ts.
describe('capability matrix', () => {
  it('keeps user management and the audit log ADMIN-only', () => {
    for (const r of ROLES) {
      expect(can(r, 'users.manage')).toBe(r === 'ADMIN');
      expect(can(r, 'audit.read')).toBe(r === 'ADMIN');
    }
  });

  it('makes SUPPORT read-only', () => {
    expect(can('SUPPORT', 'shipment.readAll')).toBe(true);
    for (const cap of ['shipment.create', 'shipment.assign', 'shipment.cancelAny', 'drivers.approve', 'users.manage'] as const) {
      expect(can('SUPPORT', cap)).toBe(false);
    }
  });

  it('lets only dispatch assign drivers', () => {
    expect(ROLES.filter((r) => can(r, 'shipment.assign'))).toEqual(['ADMIN', 'DISPATCHER']);
  });

  it('denies everything without a role', () => {
    for (const cap of Object.keys(CAPABILITIES) as (keyof typeof CAPABILITIES)[]) expect(can(undefined, cap)).toBe(false);
  });
});

describe('allowedStatusActions', () => {
  it('lets the assigned driver move forward but never cancel', () => {
    const s = ship({ status: 'IN_TRANSIT', driverUserId: 'drv-u', driverId: 'drv' });
    expect(allowedStatusActions({ id: 'drv-u', role: 'DRIVER' }, s)).toEqual(['OUT_FOR_DELIVERY']);
  });

  it('gives a different driver nothing', () => {
    const s = ship({ status: 'IN_TRANSIT', driverUserId: 'drv-u', driverId: 'drv' });
    expect(allowedStatusActions({ id: 'someone-else', role: 'DRIVER' }, s)).toEqual([]);
  });

  it('lets a customer cancel only before pickup', () => {
    expect(allowedStatusActions({ id: 'cust-1', role: 'CUSTOMER' }, ship())).toEqual(['CANCELLED']);
    expect(allowedStatusActions({ id: 'cust-1', role: 'CUSTOMER' }, ship({ status: 'PICKED_UP' }))).toEqual([]);
    expect(allowedStatusActions({ id: 'cust-2', role: 'CUSTOMER' }, ship())).toEqual([]);
  });

  it('hides "picked up" until a driver is assigned', () => {
    expect(allowedStatusActions({ id: 'a', role: 'DISPATCHER' }, ship())).toEqual(['CANCELLED']);
    expect(allowedStatusActions({ id: 'a', role: 'DISPATCHER' }, ship({ driverId: 'd' }))).toEqual(['PICKED_UP', 'CANCELLED']);
  });

  it('gives support no actions at all', () => {
    expect(allowedStatusActions({ id: 'x', role: 'SUPPORT' }, ship({ driverId: 'd' }))).toEqual([]);
  });
});

it('sends drivers to their jobs and everyone else to the dashboard', () => {
  expect(homeFor('DRIVER')).toBe('/driver');
  expect(homeFor('CUSTOMER')).toBe('/dashboard');
});
