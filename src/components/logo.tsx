import { cn } from '@/lib/utils';

// Two stops joined by a route. Drawn in the text colour, with the destination
// in brand violet, so it sits quietly next to the wordmark.
export const LogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" className={cn('size-7 text-fg', className)} aria-hidden>
    <circle cx="7.5" cy="24.5" r="3.5" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="24.5" cy="7.5" r="4" fill="var(--brand)" />
    <path d="M10.5 22C16 17 10 13 16.5 11.5c3-.7 4.5-.2 5.5-1.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const Logo = ({ className, compact = false }: { className?: string; compact?: boolean }) => (
  <span className={cn('inline-flex items-center gap-2', className)}>
    <LogoMark />
    {!compact ? <span className="font-display text-[23px] leading-none font-extrabold tracking-tighter text-fg">LogiTrack</span> : null}
  </span>
);
