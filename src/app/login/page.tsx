'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { ApiError, lastSignedIn } from '@/lib/api';
import { errorMessage } from '@/hooks/queries';
import { homeFor } from '@/lib/rbac';
import { ROLE_LABEL, type Role } from '@/lib/types';
import { cn } from '@/lib/utils';

// One-click sign-in for the seeded demo accounts. The password comes from
// .env.local written by the local dev script, so it never lands in a
// production bundle; without it the shortcuts are not rendered at all.
const DEMO_PASSWORD = process.env['NEXT_PUBLIC_DEMO_PASSWORD'] ?? '';
const DEMO = DEMO_PASSWORD.length > 0;
const DEMO_ACCOUNTS: { role: Role; email: string }[] = [
  { role: 'ADMIN', email: 'admin@logitrack.local' },
  { role: 'DISPATCHER', email: 'dispatch@logitrack.local' },
  { role: 'SUPPORT', email: 'support@logitrack.local' },
  { role: 'DRIVER', email: 'driver2@logitrack.local' },
  { role: 'CUSTOMER', email: 'customer1@logitrack.local' },
];

const SLIDES = [
  {
    image: '/auth/handover.jpg',
    quote: 'Your customers watch the parcel come to them, not the clock.',
    title: 'Live tracking',
    lines: ['Every shipment on the map', 'From pickup to the doorstep'],
    chips: ['Picked up · Ikeja', 'Out for delivery', 'Delivered ✓'],
  },
  {
    image: '/auth/van.jpg',
    quote: 'Every driver, every job and every stop, in one place.',
    title: 'Dispatch',
    lines: ['Approve drivers, assign jobs', 'See who is free right now'],
    chips: ['3 drivers free', 'Job assigned · Lekki', 'New driver approved'],
  },
];

// Soft filled fields on a lavender wash; the border turns violet on focus.
const field =
  'h-12 w-full rounded-2xl border border-transparent bg-surface-2 px-4 text-[15px] text-fg placeholder:text-muted transition-colors focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand-soft focus:outline-none';

// Tilted chat-bubble chips over the showcase photo, as in the talkpadi.com hero.
const CHIP_STYLE = [
  'bg-brand-200 rotate-[-2deg]',
  'bg-cream rotate-[1.5deg]',
  'bg-mint rotate-[-1deg]',
];
const CHIP_DOT = ['bg-brand', 'bg-orange', 'bg-teal'];

export default function LoginPage() {
  const { login, register, user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = React.useState<'login' | 'register'>('login');
  const [role, setRole] = React.useState<'CUSTOMER' | 'DRIVER'>('CUSTOMER');
  const [remember, setRemember] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [show, setShow] = React.useState(false);
  const [forgot, setForgot] = React.useState(false);
  const name = React.useSyncExternalStore(() => () => {}, lastSignedIn.get, () => null);

  React.useEffect(() => {
    if (!loading && user) router.replace(homeFor(user.role));
  }, [loading, user, router]);

  async function attempt(key: string, fn: () => Promise<void>) {
    setError(null);
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      // Same message for unknown email and wrong password, matching the server.
      setError(err instanceof ApiError && err.status === 401
        ? (err.message.includes('disabled') ? 'This account has been disabled.' : 'Email or password is incorrect.')
        : errorMessage(err));
      setBusy(null);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? '').trim();
    void attempt('form', () => (mode === 'login'
      ? login(get('email'), String(f.get('password') ?? ''), remember)
      : register({
          email: get('email'),
          password: String(f.get('password') ?? ''),
          name: get('name'),
          ...(get('phone') ? { phone: get('phone') } : {}),
          role,
        })));
  }

  const switchMode = (m: 'login' | 'register') => { setMode(m); setError(null); setForgot(false); };

  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12 lg:px-16">
        <Logo />

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-[40px] leading-[1.05] font-extrabold tracking-tight">
            {mode === 'login' ? (name ? `Welcome back, ${name}` : 'Welcome back') : 'Create an account'}
          </h1>
          <p className="mt-3 text-[15px] text-muted">
            {mode === 'login' ? 'Welcome back! Please enter your details.' : 'Start sending or delivering in a few minutes.'}
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            {mode === 'register' ? (
              <>
                <fieldset>
                  <legend className="mb-2 text-sm text-muted">I want to</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {([['CUSTOMER', 'Send parcels'], ['DRIVER', 'Deliver parcels']] as const).map(([r, label]) => (
                      <label
                        key={r}
                        className={cn(
                          'flex cursor-pointer items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-sm transition-colors',
                          role === r ? 'border-brand bg-lavender text-fg' : 'border-line text-muted hover:border-line-strong',
                        )}
                      >
                        <input type="radio" name="role" className="size-4 accent-[var(--brand)]" checked={role === r} onChange={() => setRole(r)} />
                        {label}
                      </label>
                    ))}
                  </div>
                  {role === 'DRIVER' ? <p className="mt-2 text-[13px] text-muted">Dispatch reviews new drivers before their first job.</p> : null}
                </fieldset>
                <div>
                  <label htmlFor="name" className="sr-only">Full name</label>
                  <input id="name" name="name" required autoComplete="name" placeholder="Full name" className={field} />
                </div>
              </>
            ) : null}

            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" placeholder="Email" className={field} />
            </div>

            {mode === 'register' ? (
              <div>
                <label htmlFor="phone" className="sr-only">Phone (optional)</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="Phone (optional)" className={field} />
              </div>
            ) : null}

            <div className="relative">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type={show ? 'text' : 'password'}
                required
                minLength={12}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'login' ? 'Password' : 'Password (12+ characters)'}
                className={cn(field, 'pr-10')}
              />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center text-faint hover:text-fg" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            {mode === 'login' ? (
              <div className="flex items-center justify-between pt-1 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-fg">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 rounded border-line accent-[var(--brand)]" />
                  Remember for 30 days
                </label>
                <button type="button" onClick={() => setForgot((f) => !f)} className="cursor-pointer font-medium text-brand-strong underline underline-offset-2 hover:text-brand">
                  Forgot password
                </button>
              </div>
            ) : null}

            {forgot && mode === 'login' ? (
              <p className="rounded-2xl bg-lavender px-4 py-3 text-[13px] leading-relaxed text-muted">
                Ask your LogiTrack administrator to reset it. They&apos;ll give you a temporary password, which you can change in Settings after signing in.
              </p>
            ) : null}

            {error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : null}

            <Button type="submit" variant="accent" size="lg" className="mt-2 h-13 w-full text-[15px]" loading={busy === 'form'} disabled={!!busy}>
              {mode === 'login' ? 'Log in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="relative cursor-pointer font-medium text-fg">
              {mode === 'login' ? 'Sign up for free' : 'Log in'}
              {/* A quick pen stroke, not a CSS underline. */}
              <svg className="pointer-events-none absolute -bottom-2.5 left-0 h-2.5 w-full text-accent" viewBox="0 0 120 10" preserveAspectRatio="none" fill="none" aria-hidden>
                <path d="M2 7.5C26 4.5 61 3.2 118 5.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M32 8.6C55 7 80 6.6 104 7.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".55" />
              </svg>
            </button>
          </p>

          {DEMO && mode === 'login' ? (
            <div className="mt-12 rounded-3xl bg-surface-2 p-5">
              <p className="text-[13px] text-muted">Local demo - sign in as</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    disabled={!!busy}
                    onClick={() => void attempt(a.email, () => login(a.email, DEMO_PASSWORD, remember))}
                    className="cursor-pointer rounded-full bg-surface px-3 py-1 text-sm font-medium text-fg ring-1 ring-line transition hover:text-brand-strong hover:ring-brand/40 disabled:opacity-50"
                  >
                    {busy === a.email ? 'Signing in…' : ROLE_LABEL[a.role]}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Showcase />
    </div>
  );
}

function Showcase() {
  const [i, setI] = React.useState(0);
  const go = (d: number) => setI((n) => (n + d + SLIDES.length) % SLIDES.length);

  // Restarts on every change, so a manual click gets a full slide's time.
  React.useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 8000);
    return () => clearInterval(t);
  }, [i]);

  const slide = SLIDES[i]!;
  return (
    <div className="relative hidden overflow-hidden bg-linear-to-b from-lavender via-surface to-cream p-6 lg:block xl:p-8">
      <div className="lt-glow h-full">
        {/* Violet-to-peach hairline frame around the photo. */}
        <div className="h-full rounded-[2.25rem] bg-linear-to-r from-brand/30 to-[#f58f7dc3]/70 p-1">
          <div className="relative h-full overflow-hidden rounded-[2rem] bg-ink-900">
            {SLIDES.map((s, k) => (
              <Image
                key={s.image}
                src={s.image}
                alt=""
                fill
                priority={k === 0}
                sizes="50vw"
                className={cn('object-cover transition-opacity duration-700', k === i ? 'opacity-100' : 'opacity-0')}
              />
            ))}
            {/* Darkens only the lower part, where the text sits, so it stays legible. */}
            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

            <ul key={i} className="absolute top-8 right-8 flex flex-col items-end gap-3" aria-hidden>
              {slide.chips.map((c, k) => (
                <li
                  key={c}
                  className={cn('flex animate-fade-up items-center gap-2 rounded-l-xl rounded-br-xl border border-white px-3.5 py-2.5 text-sm font-medium text-fg shadow-2xl shadow-black/20', CHIP_STYLE[k])}
                  style={{ animationDelay: `${k * 120}ms` }}
                >
                  <span className={cn('size-2 rounded-full', CHIP_DOT[k])} />
                  {c}
                </li>
              ))}
            </ul>

            <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-12">
              <p className="max-w-xl font-display text-[36px] leading-[1.1] font-extrabold tracking-tight xl:text-[44px]">{slide.quote}</p>
              <div className="mt-10 flex items-end justify-between gap-6">
                <div>
                  <p className="font-display text-[28px] font-extrabold tracking-tight">{slide.title}</p>
                  <p className="mt-3 text-[15px] font-medium">{slide.lines[0]}</p>
                  <p className="mt-1 text-[15px] text-white/80">{slide.lines[1]}</p>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => go(-1)} className="grid size-14 cursor-pointer place-items-center rounded-full bg-linear-to-b from-white to-[#e8e8e8] text-fg shadow-lg shadow-black/25 transition hover:scale-105" aria-label="Previous slide">
                    <ArrowLeft className="size-5" />
                  </button>
                  <button type="button" onClick={() => go(1)} className="grid size-14 cursor-pointer place-items-center rounded-full bg-linear-to-b from-white to-[#e8e8e8] text-fg shadow-lg shadow-black/25 transition hover:scale-105" aria-label="Next slide">
                    <ArrowRight className="size-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
