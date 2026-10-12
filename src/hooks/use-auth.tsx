'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { api, lastSignedIn, tokens } from '@/lib/api';
import { homeFor } from '@/lib/rbac';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (i: { email: string; password: string; name: string; phone?: string; role?: 'CUSTOMER' | 'DRIVER' }) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
}

const Ctx = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const qc = useQueryClient();

  React.useEffect(() => {
    let cancelled = false;
    // A stored token may be expired or revoked, so the server decides, not us.
    void (async () => {
      try {
        if (tokens.access) {
          const me = await api.auth.me();
          if (!cancelled) setUser(me);
        }
      } catch {
        tokens.clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = React.useCallback(async (email: string, password: string, remember = true) => {
    const r = await api.auth.login(email, password);
    tokens.set(r.tokens, remember);
    lastSignedIn.set(r.user.name);
    // Another account's cached data must never render for this one.
    qc.clear();
    setUser(r.user);
    router.push(homeFor(r.user.role));
  }, [router, qc]);

  const register = React.useCallback(async (i: Parameters<AuthState['register']>[0]) => {
    const r = await api.auth.register(i);
    tokens.set(r.tokens, true);
    lastSignedIn.set(r.user.name);
    qc.clear();
    setUser(r.user);
    router.push(homeFor(r.user.role));
  }, [router, qc]);

  const logout = React.useCallback(async () => {
    await api.auth.logout();
    setUser(null);
    qc.clear();
    router.push('/login');
  }, [router, qc]);

  const value = React.useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
