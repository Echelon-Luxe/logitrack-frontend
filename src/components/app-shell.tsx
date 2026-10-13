'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, PanelLeft, Plus, Search, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUnreadCount } from '@/hooks/queries';
import { can } from '@/lib/rbac';
import { ROLE_LABEL } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/components/command-palette';
import { NAV_ADMIN, NAV_FOOTER, NAV_MAIN, visibleFor, type NavItem } from '@/components/nav';
import { Logo } from '@/components/logo';

const COLLAPSE_KEY = 'lt.sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  // The drawer is open for the page it was opened on; navigating closes it.
  const [drawerPath, setDrawerPath] = React.useState<string | null>(null);
  const mobileOpen = drawerPath === pathname;
  const setMobileOpen = (o: boolean) => setDrawerPath(o ? pathname : null);
  const [collapsed, setCollapsed] = React.useState(() => {
    try { return typeof window !== 'undefined' && localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  const unread = useUnreadCount(!!user);

  React.useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);


  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);


  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1'); } catch { /* ignore */ }
      return !c;
    });
  };

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-brand border-r-transparent" />
          Loading your workspace…
        </div>
      </div>
    );
  }

  const unreadCount = unread.data?.count ?? 0;
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navLink = (item: NavItem, compact: boolean) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        title={compact ? item.label : undefined}
        className={cn(
          'group flex items-center gap-3 rounded-full px-4 py-2.5 text-[15px] font-medium transition-colors',
          compact && 'justify-center px-0',
          active ? 'bg-surface text-brand-strong shadow-[0_2px_10px_-4px_rgb(70_52_183/0.35)]' : 'text-muted hover:bg-surface/70 hover:text-fg',
        )}
      >
        <item.icon className="size-[18px] shrink-0" strokeWidth={active ? 2.25 : 1.75} />
        {!compact ? <span className="flex-1 truncate">{item.label}</span> : null}
        {item.badge === 'unread' && unreadCount > 0 ? (
          compact
            ? <span className="absolute ml-5 -mt-5 size-2 rounded-full bg-accent" />
            : <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums">{unreadCount > 99 ? '99+' : unreadCount}</span>
        ) : null}
      </Link>
    );
  };

  const sidebar = (compact: boolean, mobile = false) => (
    <div className="flex h-full flex-col gap-5 p-4">
      <div className={cn('flex h-10 items-center gap-3 px-1', compact && 'flex-col h-auto')}>
        <Link href="/" className="flex min-w-0 flex-1 items-center">
          <Logo compact={compact} />
        </Link>
        {mobile ? (
          <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X /></Button>
        ) : (
          <Button variant="ghost" size="icon-sm" onClick={toggleCollapsed} aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}>
            <PanelLeft />
          </Button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className={cn(
          'flex h-11 cursor-pointer items-center gap-2.5 rounded-full border border-line bg-surface px-4 text-[15px] text-faint transition hover:border-line-strong',
          compact && 'justify-center px-0',
        )}
        aria-label="Search"
      >
        <Search className="size-[18px]" />
        {!compact ? (
          <>
            <span className="flex-1 text-left">Search</span>
            <kbd className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">⌘K</kbd>
          </>
        ) : null}
      </button>

      <nav className="scroll-thin -mx-1 flex flex-1 flex-col gap-1 overflow-y-auto px-1" aria-label="Main">
        {visibleFor(NAV_MAIN, user.role).map((i) => navLink(i, compact))}
        {visibleFor(NAV_ADMIN, user.role).length ? (
          <>
            {!compact ? <p className="mt-5 mb-1 px-4 text-[11px] font-semibold tracking-wider text-faint uppercase">Administration</p> : <div className="my-2 border-t border-line" />}
            {visibleFor(NAV_ADMIN, user.role).map((i) => navLink(i, compact))}
          </>
        ) : null}
        <div className="my-2" />
        {visibleFor(NAV_FOOTER, user.role).map((i) => navLink(i, compact))}
      </nav>

      <div className={cn('flex items-center gap-3 border-t border-line pt-4', compact && 'flex-col')}>
        <Link href="/settings" className="flex min-w-0 flex-1 items-center gap-3" title="Settings">
          <Avatar name={user.name} size="sm" />
          {!compact ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-[13px] text-muted">{ROLE_LABEL[user.role]} · {user.email}</span>
            </span>
          ) : null}
        </Link>
        <Button variant="ghost" size="icon-sm" onClick={() => void logout()} aria-label="Sign out" title="Sign out"><LogOut /></Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={cn('hidden shrink-0 transition-[width] duration-200 lg:block', collapsed ? 'w-[84px]' : 'w-[288px]')}>
        {sidebar(collapsed)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[288px] max-w-[85vw] bg-bg shadow-[var(--shadow-pop)] animate-fade-up">
            {sidebar(false, true)}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:py-3 lg:pr-3">
        {/* Mobile top bar */}
        <header className="flex items-center gap-2 border-b border-line bg-bg px-4 py-3 lg:hidden">
          <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu /></Button>
          <Logo className="flex-1" />
          <Button variant="ghost" size="icon-sm" onClick={() => setPaletteOpen(true)} aria-label="Search"><Search /></Button>
          {can(user.role, 'shipment.create') ? (
            <Button asChild variant="accent" size="icon-sm"><Link href="/shipments/new" aria-label="New shipment"><Plus /></Link></Button>
          ) : null}
        </header>

        <main className="scroll-thin relative min-h-0 flex-1 overflow-y-auto bg-surface lg:rounded-[28px] lg:border lg:border-line">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

// Standard page padding; the tracking page opts out to go edge to edge.
export const PageContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8', className)}>{children}</div>
);
