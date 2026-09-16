import type {
  Driver, Notification, Shipment, ShipmentStatus, TokenPair, TrackingEvent, User,
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

export const tokens = {
  get access() { return safeGet(ACCESS); },
  get refresh() { return safeGet(REFRESH); },
  set(pair: TokenPair) {
    safeSet(ACCESS, pair.accessToken);
    safeSet(REFRESH, pair.refreshToken);
  },
  clear() {
    safeRemove(ACCESS);
    safeRemove(REFRESH);
  },
};

// localStorage throws in private windows and when site data is blocked.
function safeGet(k: string): string | null {
  try { return localStorage.getItem(k); } catch { return null; }
}
function safeSet(k: string, v: string): void {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
}
function safeRemove(k: string): void {
  try { localStorage.removeItem(k); } catch { /* ignore */ }
}

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

const post = <T>(p: string, body: unknown) =>
  request<T>(p, { method: 'POST', body: JSON.stringify(body) });

export const api = {
  auth: {
    login: (email: string, password: string) =>
      post<{ user: User; tokens: TokenPair }>('/auth/login', { email, password }),
    register: (input: { email: string; password: string; name: string; role?: 'CUSTOMER' | 'DRIVER' }) =>
      post<{ user: User; tokens: TokenPair }>('/auth/register', input),
    me: () => request<User>('/auth/me'),
    logout: async () => {
      const rt = tokens.refresh;
      if (rt) await post<void>('/auth/logout', { refreshToken: rt }).catch(() => {});
      tokens.clear();
    },
  },

  shipments: {
    list: (q: { customerId?: string; driverId?: string; status?: ShipmentStatus } = {}) => {
      const s = new URLSearchParams(
        Object.entries(q).filter(([, v]) => v != null) as [string, string][],
      ).toString();
      return request<Shipment[]>(`/shipments${s ? `?${s}` : ''}`);
    },
    get: (id: string) => request<Shipment>(`/shipments/${id}`),
    create: (input: { customerId: string; origin: string; destination: string }) =>
      post<Shipment>('/shipments', input),
    setStatus: (id: string, status: ShipmentStatus) =>
      post<Shipment>(`/shipments/${id}/status`, { status }),
    assign: (id: string, driverId: string) =>
      post<Shipment>(`/shipments/${id}/assign`, { driverId }),
  },

  tracking: {
    timeline: (shipmentId: string) =>
      request<{ shipmentId: string; events: TrackingEvent[] }>(`/tracking/${shipmentId}`),
  },

  drivers: {
    list: (available?: boolean) =>
      request<Driver[]>(`/drivers${available ? '?available=true' : ''}`),
    get: (id: string) => request<Driver>(`/drivers/${id}`),
    setAvailability: (id: string, availability: 'ONLINE' | 'OFFLINE') =>
      post<Driver>(`/drivers/${id}/availability`, { availability }),
  },

  notifications: {
    forRecipient: (recipientId: string) =>
      request<Notification[]>(`/notifications?recipientId=${encodeURIComponent(recipientId)}`),
  },

  payments: {
    initialize: (input: { shipmentId: string; customerId: string; email: string; amount: number }) =>
      post<{ reference: string; authorizationUrl: string; amount: number; currency: string }>(
        '/payments/initialize', { ...input, currency: 'NGN' },
      ),
  },
};
