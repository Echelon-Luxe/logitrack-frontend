'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, LayoutDashboard, Truck, Shield, LogOut, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';

interface NavItem { href: string; label: string; icon: React.ElementType; roles?: Role[] }

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/shipments', label: 'Shipments', icon: Package },
  { href: '/driver', label: 'Driver', icon: Truck, roles: ['DRIVER', 'ADMIN'] },
  { href: '/admin', label: 'Operations', icon: Shield, roles: ['ADMIN'] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="size-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-accent-500" />
      </div>
    );
  }
  if (!user) return null;

  // Hiding a link is presentation only; the gateway enforces the actual rule.
  const visible = NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg bg-accent-500 text-white">
              <Package className="size-4" />
            </span>
            LogiTrack
          </Link>

          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            {visible.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'bg-ink-100 font-medium text-[var(--text)] dark:bg-ink-800'
                      : 'text-[var(--muted)] hover:text-[var(--text)]',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/shipments/new"><Plus className="size-4" />New shipment</Link>
            </Button>
            <div className="hidden text-right text-xs leading-tight sm:block">
              <div className="font-medium">{user.name}</div>
              <div className="text-[var(--muted)]">{user.role.toLowerCase()}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-[var(--border)] px-4 py-2 sm:hidden">
          {visible.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--muted)]">
              <Icon className="size-4" />{label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
