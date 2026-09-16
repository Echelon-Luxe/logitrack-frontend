'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { api, tokens } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (i: { email: string; password: string; name: string; role?: 'CUSTOMER' | 'DRIVER' }) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

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

  const login = React.useCallback(async (email: string, password: string) => {
    const r = await api.auth.login(email, password);
    tokens.set(r.tokens);
    setUser(r.user);
    router.push('/dashboard');
  }, [router]);

  const register = React.useCallback(async (i: Parameters<AuthState['register']>[0]) => {
    const r = await api.auth.register(i);
    tokens.set(r.tokens);
    setUser(r.user);
    router.push('/dashboard');
  }, [router]);

  const logout = React.useCallback(async () => {
    await api.auth.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = React.useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
