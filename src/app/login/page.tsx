'use client';

import * as React from 'react';
import { Package } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, Field } from '@/components/ui/input';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = React.useState<'login' | 'register'>('login');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      if (mode === 'login') {
        await login(String(f.get('email')), String(f.get('password')));
      } else {
        await register({
          email: String(f.get('email')),
          password: String(f.get('password')),
          name: String(f.get('name')),
          role: f.get('role') === 'DRIVER' ? 'DRIVER' : 'CUSTOMER',
        });
      }
    } catch (err) {
      // 401 is intentionally vague: the server gives the same answer for an
      // unknown email and a wrong password, so the UI must not invent detail.
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Email or password is incorrect.'
          : err instanceof ApiError ? err.message : 'Something went wrong. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="grid size-11 place-items-center rounded-2xl bg-accent-500 text-white shadow-lg shadow-accent-500/25">
            <Package className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">LogiTrack</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-5">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              {mode === 'register' && (
                <Field label="Name" htmlFor="name">
                  <Input id="name" name="name" required autoComplete="name" placeholder="Ada Lovelace" />
                </Field>
              )}

              <Field label="Email" htmlFor="email">
                <Input id="email" name="email" type="email" required
                  autoComplete="email" placeholder="you@example.com" />
              </Field>

              <Field
                label="Password"
                htmlFor="password"
                hint={mode === 'register' ? 'At least 12 characters.' : undefined}
              >
                <Input id="password" name="password" type="password" required
                  minLength={mode === 'register' ? 12 : undefined}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              </Field>

              {mode === 'register' && (
                <Field label="I am a" htmlFor="role">
                  <select id="role" name="role"
                    className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm">
                    <option value="CUSTOMER">Customer</option>
                    <option value="DRIVER">Driver</option>
                  </select>
                </Field>
              )}

              {error && (
                <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={busy} className="mt-1 w-full">
                {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-sm text-[var(--muted)]">
          {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            className="font-medium text-accent-600 hover:underline dark:text-accent-400"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
