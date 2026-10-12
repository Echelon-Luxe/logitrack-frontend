import { nextStatuses, type Role, type Shipment, type ShipmentStatus, type User } from './types';

// The permission matrix, mirrored from logitrack-infrastructure/docs/rbac.md.
//
// This decides what the UI SHOWS. The services decide what is ALLOWED and
// re-check every request, so a mistake here hides a button or shows one that
// 403s - it never grants access.

export const CAPABILITIES = {
  'shipment.create': ['ADMIN', 'DISPATCHER', 'CUSTOMER'],
  'shipment.createForCustomer': ['ADMIN', 'DISPATCHER'],
  'shipment.readAll': ['ADMIN', 'DISPATCHER', 'SUPPORT'],
  'shipment.assign': ['ADMIN', 'DISPATCHER'],
  'shipment.cancelAny': ['ADMIN', 'DISPATCHER'],
  'location.report': ['DRIVER'],
  'drivers.read': ['ADMIN', 'DISPATCHER', 'SUPPORT'],
  'drivers.approve': ['ADMIN', 'DISPATCHER'],
  'driver.self': ['DRIVER'],
  'customers.read': ['ADMIN', 'DISPATCHER', 'SUPPORT'],
  'users.read': ['ADMIN', 'DISPATCHER', 'SUPPORT'],
  'users.manage': ['ADMIN'],
  'audit.read': ['ADMIN'],
  'payments.pay': ['CUSTOMER'],
  'payments.readAll': ['ADMIN', 'SUPPORT'],
  'earnings.own': ['DRIVER'],
  'fleet.live': ['ADMIN', 'DISPATCHER', 'SUPPORT'],
} as const satisfies Record<string, readonly Role[]>;

export type Capability = keyof typeof CAPABILITIES;

export const can = (role: Role | undefined | null, cap: Capability): boolean =>
  !!role && (CAPABILITIES[cap] as readonly Role[]).includes(role);

export const isStaff = (role: Role | undefined | null): boolean => can(role, 'shipment.readAll');

/**
 * Which status changes this user may make on this shipment - the transition
 * table intersected with the server's rule in shipment-service access.ts.
 */
export function allowedStatusActions(user: Pick<User, 'id' | 'role'>, s: Pick<Shipment, 'status' | 'customerId' | 'driverUserId' | 'driverId'>): ShipmentStatus[] {
  const next = nextStatuses(s.status).filter((to) => to !== 'PICKED_UP' || !!s.driverId);
  if (can(user.role, 'shipment.cancelAny')) return [...next];
  if (user.role === 'DRIVER' && s.driverUserId === user.id) return next.filter((to) => to !== 'CANCELLED');
  if (user.role === 'CUSTOMER' && s.customerId === user.id && s.status === 'CREATED') {
    return next.filter((to) => to === 'CANCELLED');
  }
  return [];
}

// Where each role lands after signing in.
export const homeFor = (role: Role): string => (role === 'DRIVER' ? '/driver' : '/dashboard');
