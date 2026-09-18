export const SHIPMENT_STATUSES = [
  'CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export type Role = 'CUSTOMER' | 'DRIVER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Shipment {
  id: string;
  reference: string;
  customerId: string;
  driverId: string | null;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  reference: string;
  eventType: string;
  status: string;
  occurredAt: string;
  recordedAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  name: string;
  vehicleType: string;
  availability: 'ONLINE' | 'OFFLINE';
  currentShipmentId: string | null;
  status: 'OFFLINE' | 'AVAILABLE' | 'ON_JOB';
}

export interface Notification {
  id: string;
  shipmentId: string;
  reference: string;
  subject: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Mirrors the shipment-service state machine. Duplicated deliberately: the UI
// must grey out impossible actions without a round trip, and the server still
// rejects anything invalid.
const TRANSITIONS: Record<ShipmentStatus, readonly ShipmentStatus[]> = {
  CREATED:          ['PICKED_UP', 'CANCELLED'],
  PICKED_UP:        ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT:       ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED:        [],
  CANCELLED:        [],
};

export const nextStatuses = (s: ShipmentStatus): readonly ShipmentStatus[] => TRANSITIONS[s] ?? [];
export const isTerminal = (s: ShipmentStatus): boolean => nextStatuses(s).length === 0;

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  CREATED: 'Created',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export type EarningStatus = 'PENDING' | 'PAID' | 'VOID';

export interface Earning {
  id: string;
  shipmentId: string;
  driverId: string;
  // Kobo. Divide by 100 only when displaying - never store the divided value.
  amount: number;
  currency: string;
  status: EarningStatus;
  paidAt: string | null;
  createdAt: string;
}

export interface DriverEarnings {
  driverId: string;
  currency: string;
  totals: { pending: number; paid: number; void: number };
  count: number;
  earnings: Earning[];
}

export const EARNING_LABEL: Record<EarningStatus, string> = {
  PENDING: 'Awaiting delivery',
  PAID: 'Paid',
  VOID: 'Cancelled',
};

/** Kobo to a display string. Money is integer kobo everywhere else. */
export const formatKobo = (kobo: number, currency = 'NGN'): string =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(kobo / 100);
