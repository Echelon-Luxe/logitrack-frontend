import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';

// Flat, muted tints - one per person, stable across the app. Enough to tell
// people apart in a list without turning every row into a sticker.
const TONES = [
  'bg-sky-100 text-sky-800', 'bg-violet-100 text-violet-800', 'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800', 'bg-rose-100 text-rose-800', 'bg-slate-200 text-slate-700',
  'bg-teal-100 text-teal-800', 'bg-indigo-100 text-indigo-800',
];

const toneOf = (seed: string): string => {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length]!;
};

export const Avatar = ({ name, size = 'md', className }: { name: string | null | undefined; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }) => (
  <span
    className={cn(
      'inline-grid shrink-0 place-items-center rounded-full font-semibold',
      toneOf(name ?? '?'),
      { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' }[size],
      className,
    )}
    aria-hidden
  >
    {initials(name)}
  </span>
);
