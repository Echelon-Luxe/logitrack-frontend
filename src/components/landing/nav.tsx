'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { homeFor } from '@/lib/rbac';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { NAV_LINKS } from './content';

// Fixed bar that frosts over once the page scrolls. Signed-in visitors get a
// way back into the app instead of a second login.
export function LandingNav() {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,box-shadow] duration-300',
        scrolled ? 'bg-white/80 shadow-[0_1px_0_rgb(0_0_0/0.06)] backdrop-blur-md' : 'bg-transparent',
      )}
      aria-label="Main"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:h-20 sm:px-6">
        <Link href="/" className="flex-1" aria-label="LogiTrack home"><Logo /></Link>
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-sm text-lp-ink underline-offset-4 transition hover:underline">{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="flex flex-1 justify-end">
          {!loading && user ? (
            <Link href={homeFor(user.role)} className="inline-flex items-center gap-1 rounded-full bg-lp-ink px-4 py-2.5 text-xs font-medium text-white transition hover:bg-lp-ink/85">
              Open dashboard<ArrowUpRight className="size-3.5" />
            </Link>
          ) : (
            <Link href="/login" className="inline-flex items-center gap-1 rounded-full bg-lp-ink px-5 py-2.5 text-xs font-medium text-white transition hover:bg-lp-ink/85">
              Log in<ArrowUpRight className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
