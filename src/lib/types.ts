export const SHIPMENT_STATUSES = [
  'CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const ROLES = ['ADMIN', 'DISPATCHER', 'SUPPORT', 'DRIVER', 'CUSTOMER'] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Shipment {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  driverId: string | null;
  driverUserId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  originLat: number | null;
  originLng: number | null;
  destLat: number | null;
  destLng: number | null;
  priceKobo: number;
  distanceKm: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentStats {
  total: number;
  byStatus: Partial<Record<ShipmentStatus, number>>;
  revenueKobo: number;
  daily: { date: string; created: number; delivered: number }[];
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

export interface LocationPoint {
  lat: number;
  lng: number;
  heading: number | null;
  speedKph: number | null;
  recordedAt: string;
}

export interface LivePosition extends LocationPoint {
  shipmentId: string;
  driverUserId: string;
}

export type DriverStatus = 'OFFLINE' | 'AVAILABLE' | 'ON_JOB';

export interface Driver {
  id: string;
  userId: string;
  name: string;
  vehicleType: string;
  plateNumber: string | null;
  phone: string | null;
  availability: 'ONLINE' | 'OFFLINE';
  currentShipmentId: string | null;
  approvedAt: string | null;
  status: DriverStatus;
  createdAt: string;
}

export interface Notification {
  id: string;
  shipmentId: string;
  reference: string;
  eventType: string;
  subject: string;
  body: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  readAt: string | null;
  createdAt: string;
}

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'ABANDONED';

export interface Payment {
  id: string;
  reference: string;
  shipmentId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  channel: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
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

// The parcel is physically with a driver in these statuses.
export const MOVING_STATUSES: readonly ShipmentStatus[] = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'];
export const isMoving = (s: ShipmentStatus): boolean => MOVING_STATUSES.includes(s);

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  CREATED: 'Pending',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

// Verb for the button that moves a shipment INTO a status.
export const STATUS_ACTION: Record<ShipmentStatus, string> = {
  CREATED: 'Reopen',
  PICKED_UP: 'Mark picked up',
  IN_TRANSIT: 'Start transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Mark delivered',
  CANCELLED: 'Cancel shipment',
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  DISPATCHER: 'Dispatcher',
  SUPPORT: 'Support',
  DRIVER: 'Driver',
  CUSTOMER: 'Customer',
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
  new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(kobo / 100);
