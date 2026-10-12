import type {
  AuditEntry, Driver, DriverEarnings, LivePosition, LocationPoint, Notification, Page, Payment, Role,
  Shipment, ShipmentStats, ShipmentStatus, TokenPair, TrackingEvent, User,
} from './types';

const BASE = process.env['NEXT_PUBLIC_API_URL'] ?? '/api';

export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

const ACCESS = 'lt.access';
const REFRESH = 'lt.refresh';
const NAME = 'lt.lastName';

// "Remember me": localStorage survives the browser closing, sessionStorage ends
// with the tab. The refresh token lives 30 days server-side either way; this
// only decides whether this device keeps it.
const stores = (): Storage[] => {
  try { return [localStorage, sessionStorage]; } catch { return []; }
};
const read = (k: string): string | null => {
  for (const s of stores()) {
    try { const v = s.getItem(k); if (v) return v; } catch { /* blocked */ }
  }
  return null;
};
const removeEverywhere = (k: string): void => {
  for (const s of stores()) { try { s.removeItem(k); } catch { /* blocked */ } }
};
// Rotation keeps the token where the user chose to put it.
const persisted = (): boolean => {
  try { return !!localStorage.getItem(REFRESH) || !sessionStorage.getItem(REFRESH); } catch { return true; }
};

export const tokens = {
  get access() { return read(ACCESS); },
  get refresh() { return read(REFRESH); },
  set(pair: TokenPair, remember = persisted()) {
    removeEverywhere(ACCESS);
    removeEverywhere(REFRESH);
    try {
      const store = remember ? localStorage : sessionStorage;
      store.setItem(ACCESS, pair.accessToken);
      store.setItem(REFRESH, pair.refreshToken);
    } catch { /* storage blocked: signed in for this page load only */ }
  },
  clear() {
    removeEverywhere(ACCESS);
    removeEverywhere(REFRESH);
  },
};

// First name of whoever last signed in on this device, for "Welcome back, Ada".
export const lastSignedIn = {
  get: (): string | null => { try { return localStorage.getItem(NAME); } catch { return null; } },
  set: (name: string) => { try { localStorage.setItem(NAME, name.split(' ')[0] ?? name); } catch { /* ignore */ } },
};

let refreshing: Promise<boolean> | null = null;

// Single-flight: several requests can 401 at once, and each retrying its own
// refresh would rotate the token repeatedly and trip reuse detection, logging
// the user out.
async function refreshOnce(): Promise<boolean> {
  refreshing ??= (async () => {
    const rt = tokens.refresh;
    if (!rt) return false;
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!res.ok) return false;
      tokens.set((await res.json()) as TokenPair);
      return true;
    } catch {
      return false;
    } finally {
      // Clear on the next tick so concurrent callers share this result.
      setTimeout(() => { refreshing = null; }, 0);
    }
  })();
  return refreshing;
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const access = tokens.access;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(access ? { authorization: `Bearer ${access}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401 && retry && tokens.refresh) {
    if (await refreshOnce()) return request<T>(path, init, false);
    tokens.clear();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as { message?: string }).message ?? res.statusText, body);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

const post = <T>(p: string, body?: unknown) =>
  request<T>(p, { method: 'POST', ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
const patch = <T>(p: string, body: unknown) =>
  request<T>(p, { method: 'PATCH', body: JSON.stringify(body) });

// Undefined, null and '' are dropped, so callers can pass optional filters as-is.
const qs = (q: Record<string, string | number | boolean | undefined | null>): string => {
  const s = new URLSearchParams(
    Object.entries(q)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return s ? `?${s}` : '';
};

export interface ShipmentQuery {
  status?: ShipmentStatus;
  statuses?: ShipmentStatus[];
  q?: string;
  limit?: number;
}

export interface CreateShipmentInput {
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  notes?: string;
  customerPhone?: string;
  // Staff creating on a customer's behalf.
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      post<{ user: User; tokens: TokenPair }>('/auth/login', { email, password }),
    register: (input: { email: string; password: string; name: string; phone?: string; role?: 'CUSTOMER' | 'DRIVER' }) =>
      post<{ user: User; tokens: TokenPair }>('/auth/register', input),
    me: () => request<User>('/auth/me'),
    updateMe: (input: { name?: string; phone?: string | null }) => patch<User>('/auth/me', input),
    changePassword: (currentPassword: string, newPassword: string) =>
      post<void>('/auth/change-password', { currentPassword, newPassword }),
    logout: async () => {
      const rt = tokens.refresh;
      if (rt) await post<void>('/auth/logout', { refreshToken: rt }).catch(() => {});
      tokens.clear();
    },
  },

  users: {
    list: (q: { q?: string; role?: Role; active?: boolean; cursor?: string; limit?: number } = {}) =>
      request<Page<User> & { total: number }>(`/users${qs(q)}`),
    summary: () => request<Record<Role, number>>('/users/summary'),
    get: (id: string) => request<User>(`/users/${id}`),
    create: (input: { email: string; name: string; role: Role; phone?: string; password?: string }) =>
      post<{ user: User; temporaryPassword?: string }>('/users', input),
    update: (id: string, input: { name?: string; phone?: string | null; role?: Role; active?: boolean }) =>
      patch<User & { sessionsRevoked: number }>(`/users/${id}`, input),
    revokeSessions: (id: string) => post<{ revoked: number }>(`/users/${id}/revoke-sessions`),
    resetPassword: (id: string) => post<{ temporaryPassword: string }>(`/users/${id}/reset-password`),
  },

  audit: {
    list: (q: { q?: string; action?: string; cursor?: string; limit?: number } = {}) =>
      request<Page<AuditEntry>>(`/audit${qs(q)}`),
  },

  shipments: {
    list: (q: ShipmentQuery = {}) =>
      request<Shipment[]>(`/shipments${qs({ ...q, statuses: q.statuses?.join(',') })}`),
    stats: (days = 14) => request<ShipmentStats>(`/shipments/stats${qs({ days })}`),
    get: (id: string) => request<Shipment & { allowedNext: ShipmentStatus[] }>(`/shipments/${id}`),
    quote: (p: { originLat: number; originLng: number; destLat: number; destLng: number }) =>
      post<{ priceKobo: number; distanceKm: number | null }>('/shipments/quote', p),
    create: (input: CreateShipmentInput) => post<Shipment>('/shipments', input),
    setStatus: (id: string, status: ShipmentStatus) =>
      post<Shipment>(`/shipments/${id}/status`, { status }),
    assign: (id: string, driverId: string) =>
      post<Shipment>(`/shipments/${id}/assign`, { driverId }),
  },

  tracking: {
    timeline: (shipmentId: string) =>
      request<{ shipmentId: string; events: TrackingEvent[] }>(`/tracking/${shipmentId}`),
    locations: (shipmentId: string, limit = 500) =>
      request<LocationPoint[]>(`/tracking/${shipmentId}/locations${qs({ limit })}`),
    live: () => request<LivePosition[]>('/tracking/live'),
    report: (shipmentId: string, p: { lat: number; lng: number; heading?: number; speedKph?: number; accuracyM?: number }) =>
      post<{ id: string; recordedAt: string }>(`/tracking/${shipmentId}/location`, p),
  },

  drivers: {
    list: (q: { available?: boolean; pending?: boolean; q?: string } = {}) =>
      request<Driver[]>(`/drivers${qs(q)}`),
    me: () => request<Driver>('/drivers/me'),
    get: (id: string) => request<Driver>(`/drivers/${id}`),
    create: (input: { vehicleType: string; plateNumber?: string; phone?: string; name?: string }) =>
      post<Driver>('/drivers', input),
    update: (id: string, input: { name?: string; vehicleType?: string; plateNumber?: string | null; phone?: string | null }) =>
      patch<Driver>(`/drivers/${id}`, input),
    approve: (id: string, approved = true) => post<Driver>(`/drivers/${id}/approve`, { approved }),
    setAvailability: (id: string, availability: 'ONLINE' | 'OFFLINE') =>
      post<Driver>(`/drivers/${id}/availability`, { availability }),
  },

  notifications: {
    list: (q: { unread?: boolean; limit?: number } = {}) => request<Notification[]>(`/notifications${qs(q)}`),
    unreadCount: () => request<{ count: number }>('/notifications/unread-count'),
    markRead: (id: string) => post<void>(`/notifications/${id}/read`),
    markAllRead: () => post<{ updated: number }>('/notifications/read-all'),
  },

  earnings: {
    mine: () => request<DriverEarnings>('/earnings/me'),
  },

  payments: {
    initialize: (shipmentId: string) =>
      post<{ reference: string; authorizationUrl: string; amount: number; currency: string }>(
        '/payments/initialize', { shipmentId },
      ),
    get: (reference: string) => request<Payment>(`/payments/${encodeURIComponent(reference)}`),
    forShipment: (shipmentId: string) => request<Payment[]>(`/payments/shipment/${shipmentId}`),
    mockComplete: (reference: string, succeeded: boolean) =>
      post<Payment>(`/payments/${encodeURIComponent(reference)}/mock-complete`, { succeeded }),
  },
};

/**
 * Opens a Server-Sent Events stream with the bearer token. EventSource cannot
 * send headers, and putting the token in the URL would leak it into logs, so
 * this reads the stream with fetch instead. Resolves when the stream ends.
 */
export async function openStream(
  path: string,
  onEvent: (event: string, data: unknown) => void,
  signal: AbortSignal,
): Promise<void> {
  const connect = () =>
    fetch(`${BASE}${path}`, {
      headers: { accept: 'text/event-stream', ...(tokens.access ? { authorization: `Bearer ${tokens.access}` } : {}) },
      signal,
      cache: 'no-store',
    });
  let res = await connect();
  if (res.status === 401 && (await refreshOnce())) res = await connect();
  if (!res.ok || !res.body) throw new ApiError(res.status, 'stream unavailable');

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += value;
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      let event = 'message';
      const data: string[] = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
      }
      if (data.length === 0) continue; // heartbeat comment
      try {
        onEvent(event, JSON.parse(data.join('\n')));
      } catch {
        /* malformed frame: skip it rather than drop the stream */
      }
    }
  }
}
