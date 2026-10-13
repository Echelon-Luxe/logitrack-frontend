import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HERO_CHIPS } from './content';

const Chip = ({ chip, className }: { chip: (typeof HERO_CHIPS)[number]; className?: string }) => (
  <div
    className={cn(
      'flex w-max items-center gap-2 rounded-l-xl rounded-br-xl border border-white! px-3.5 py-2.5 text-sm font-medium shadow-2xl shadow-black/15',
      chip.tone, chip.tilt, className,
    )}
  >
    <span className={cn('size-2 rounded-full', chip.dot)} />
    {chip.label}
  </div>
);

export function Hero() {
  return (
    <section className="relative overflow-x-clip pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* Faint violet and peach wash behind the headline. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(60%_50%_at_20%_10%,#f2f0ff_0%,transparent_70%),radial-gradient(50%_45%_at_85%_15%,#fef4ee_0%,transparent_70%)]" />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6">
        <h1 className="max-w-4xl font-lp-display text-[44px] leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Every parcel, tracked to the doorstep
        </h1>
        <p className="mt-6 max-w-2xl text-base text-lp-ink/70 sm:text-lg">
          LogiTrack brings your bookings, drivers, payments and customers into one live view. Fewer phone calls, no lost parcels.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="group inline-flex items-center gap-2 rounded-full bg-linear-to-r from-lp-coral to-lp-coral-deep px-8 py-4 font-medium text-white transition hover:shadow-lg active:scale-95"
          >
            Log in
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </Link>
          <a href="#how" className="inline-block rounded-full border border-lp-ink! bg-white px-8 py-4 text-sm text-lp-ink transition hover:scale-105 hover:shadow-lg active:scale-95">
            See how it works
          </a>
        </div>

        {/* Phones and tablets: chips sit in a row above the screenshot. */}
        <div className="mt-12 flex flex-wrap justify-center gap-3 lg:hidden" aria-hidden>
          {HERO_CHIPS.slice(0, 3).map((c) => <Chip key={c.label} chip={c} className="text-xs" />)}
        </div>

        <div className="relative mt-8 w-full lg:mt-20">
          {/* Desktop: chips float over the corners of the frame. */}
          <div className="absolute -top-8 -left-6 z-10 hidden flex-col gap-4 lg:flex" aria-hidden>
            <Chip chip={HERO_CHIPS[0]!} />
            <Chip chip={HERO_CHIPS[1]!} className="ml-10" />
          </div>
          <div className="absolute -right-6 bottom-16 z-10 hidden flex-col items-end gap-4 lg:flex" aria-hidden>
            <Chip chip={HERO_CHIPS[2]!} className="mr-10" />
            <Chip chip={HERO_CHIPS[3]!} />
          </div>

          <div className="lp-glow mx-auto max-w-5xl">
            <div className="rounded-[2rem] bg-linear-to-r from-lp-violet/30 to-[#f58f7dc3]/70 p-1">
              <Image
                src="/landing/dashboard.jpg"
                alt="The LogiTrack dashboard: shipment counts, a 14-day delivery chart and status breakdown"
                width={1440}
                height={900}
                priority
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="h-auto w-full rounded-[1.75rem] bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
