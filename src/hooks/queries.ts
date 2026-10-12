'use client';

import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError, type CreateShipmentInput, type ShipmentQuery } from '@/lib/api';
import type { Role, ShipmentStatus } from '@/lib/types';

// Query keys in one place, so a mutation can invalidate exactly what it changed.
export const qk = {
  shipments: (q?: ShipmentQuery) => ['shipments', q ?? {}] as const,
  shipment: (id: string) => ['shipment', id] as const,
  stats: ['shipments', 'stats'] as const,
  timeline: (id: string) => ['timeline', id] as const,
  trail: (id: string) => ['trail', id] as const,
  live: ['tracking', 'live'] as const,
  drivers: (q?: object) => ['drivers', q ?? {}] as const,
  driverMe: ['drivers', 'me'] as const,
  users: (q?: object) => ['users', q ?? {}] as const,
  userSummary: ['users', 'summary'] as const,
  audit: (q?: object) => ['audit', q ?? {}] as const,
  inbox: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  earnings: ['earnings', 'me'] as const,
  payments: (shipmentId: string) => ['payments', shipmentId] as const,
};

export const errorMessage = (e: unknown): string => {
  if (e instanceof ApiError) {
    const details = (e.details as { details?: { message: string }[] } | undefined)?.details;
    if (details?.length) return details.map((d) => d.message).join(', ');
    if (e.status === 403) return e.message || 'You do not have permission to do that';
    return e.message;
  }
  return e instanceof Error ? e.message : 'Something went wrong';
};

// ---- reads ---------------------------------------------------------------

export const useShipments = (q: ShipmentQuery = {}, opts: { refetchInterval?: number; enabled?: boolean } = {}) =>
  useQuery({ queryKey: qk.shipments(q), queryFn: () => api.shipments.list(q), ...opts });

export const useShipment = (id: string | undefined) =>
  useQuery({ queryKey: qk.shipment(id ?? ''), queryFn: () => api.shipments.get(id!), enabled: !!id });

export const useShipmentStats = () =>
  useQuery({ queryKey: qk.stats, queryFn: () => api.shipments.stats(14), refetchInterval: 30_000 });

export const useTimeline = (id: string | undefined) =>
  useQuery({ queryKey: qk.timeline(id ?? ''), queryFn: () => api.tracking.timeline(id!), enabled: !!id });

export const useTrail = (id: string | undefined, enabled = true) =>
  useQuery({ queryKey: qk.trail(id ?? ''), queryFn: () => api.tracking.locations(id!), enabled: !!id && enabled });

export const useLivePositions = (enabled = true) =>
  useQuery({ queryKey: qk.live, queryFn: api.tracking.live, enabled, refetchInterval: 10_000 });

export const useDrivers = (q: { available?: boolean; pending?: boolean; q?: string } = {}, enabled = true) =>
  useQuery({ queryKey: qk.drivers(q), queryFn: () => api.drivers.list(q), enabled });

export const useMyDriver = (enabled = true) =>
  useQuery({
    queryKey: qk.driverMe,
    // 404 means "not onboarded yet" - a state, not an error.
    queryFn: async () => {
      try {
        return await api.drivers.me();
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
    enabled,
  });

export const useUsers = (q: { q?: string; role?: Role; active?: boolean; limit?: number } = {}, enabled = true) =>
  useQuery({ queryKey: qk.users(q), queryFn: () => api.users.list(q), enabled });

export const useUserSummary = (enabled = true) =>
  useQuery({ queryKey: qk.userSummary, queryFn: api.users.summary, enabled });

export const useAudit = (q: { q?: string; action?: string } = {}) =>
  useQuery({ queryKey: qk.audit(q), queryFn: () => api.audit.list({ ...q, limit: 100 }) });

export const useInbox = () =>
  useQuery({ queryKey: qk.inbox, queryFn: () => api.notifications.list({ limit: 100 }), refetchInterval: 20_000 });

export const useUnreadCount = (enabled = true) =>
  useQuery({ queryKey: qk.unread, queryFn: api.notifications.unreadCount, enabled, refetchInterval: 15_000 });

export const useMyEarnings = (enabled = true) =>
  useQuery({ queryKey: qk.earnings, queryFn: api.earnings.mine, enabled });

export const usePayments = (shipmentId: string | undefined, enabled = true) =>
  useQuery({ queryKey: qk.payments(shipmentId ?? ''), queryFn: () => api.payments.forShipment(shipmentId!), enabled: !!shipmentId && enabled });

// ---- writes --------------------------------------------------------------

function useAction<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  opts: { invalidate: (args: TArgs) => QueryKey[]; success?: string | ((r: TResult, a: TArgs) => string) },
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (r, a) => {
      await Promise.all(opts.invalidate(a).map((queryKey) => qc.invalidateQueries({ queryKey })));
      const msg = typeof opts.success === 'function' ? opts.success(r, a) : opts.success;
      if (msg) toast.success(msg);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export const useSetStatus = () =>
  useAction(
    ({ id, status }: { id: string; status: ShipmentStatus }) => api.shipments.setStatus(id, status),
    {
      invalidate: ({ id }) => [qk.shipment(id), ['shipments'], qk.timeline(id), qk.driverMe, qk.earnings],
      success: (s) => `${s.reference} updated`,
    },
  );

export const useAssign = () =>
  useAction(
    ({ id, driverId }: { id: string; driverId: string }) => api.shipments.assign(id, driverId),
    { invalidate: ({ id }) => [qk.shipment(id), ['shipments'], ['drivers']], success: (s) => `${s.driverName} assigned to ${s.reference}` },
  );

export const useCreateShipment = () =>
  useAction((input: CreateShipmentInput) => api.shipments.create(input), {
    invalidate: () => [['shipments']],
    success: (s) => `Shipment ${s.reference} created`,
  });

export const useApproveDriver = () =>
  useAction(({ id, approved }: { id: string; approved: boolean }) => api.drivers.approve(id, approved), {
    invalidate: () => [['drivers']],
    success: (d, a) => (a.approved ? `${d.name} approved` : `${d.name}'s approval revoked`),
  });

export const useSetAvailability = () =>
  useAction(
    ({ id, availability }: { id: string; availability: 'ONLINE' | 'OFFLINE' }) => api.drivers.setAvailability(id, availability),
    { invalidate: () => [['drivers']], success: (d) => (d.availability === 'ONLINE' ? "You're online" : "You're offline") },
  );

export const useMarkRead = () =>
  useAction((id: string) => api.notifications.markRead(id), { invalidate: () => [qk.inbox] });

export const useMarkAllRead = () =>
  useAction(() => api.notifications.markAllRead(), { invalidate: () => [qk.inbox], success: 'All caught up' });

export const useUpdateUser = () =>
  useAction(
    ({ id, ...input }: { id: string; name?: string; phone?: string | null; role?: Role; active?: boolean }) => api.users.update(id, input),
    { invalidate: () => [['users'], ['audit']], success: (u) => `${u.name} updated${u.sessionsRevoked ? ' · signed out everywhere' : ''}` },
  );
