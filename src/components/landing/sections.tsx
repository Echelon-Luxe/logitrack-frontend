import Link from 'next/link';
import { ArrowRight, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FEATURES, PROBLEMS, ROLES, SECTORS, STEPS } from './content';

const SectionTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h2 className={cn('font-lp-display text-4xl font-extrabold tracking-tight md:text-5xl', className)}>{children}</h2>
);

export function TrustBar() {
  return (
    <section className="px-4 pb-6">
      <p className="text-center text-xs font-semibold tracking-wide uppercase sm:text-sm">Built for teams moving parcels across Lagos</p>
      <ul className="mx-auto mt-5 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 font-lp-display text-xl font-bold text-lp-ink/35 sm:text-2xl">
        {SECTORS.map((s) => <li key={s}>{s}</li>)}
      </ul>
    </section>
  );
}

export function Problems() {
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionTitle className="max-w-2xl">Deliveries shouldn’t run on phone calls</SectionTitle>
        <p className="mt-4 max-w-2xl text-lp-ink/70">Most delivery teams lose hours every day to the same four problems.</p>
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PROBLEMS.map((p) => (
            <article key={p.title} className="space-y-6 rounded-xl border border-lp-violet/10! p-6">
              <span className={cn('grid size-16 place-items-center rounded-2xl text-white', p.tint)}>
                <p.icon className="size-7" />
              </span>
              <div>
                <h3 className="font-lp-display text-xl font-extrabold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-lp-ink/70">{p.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 px-4 py-8">
      <div className="mx-auto max-w-6xl rounded-4xl bg-linear-to-b from-lp-lavender via-lp-lavender/30 to-lp-lavender/0 px-4 py-16 text-center sm:px-8">
        <SectionTitle>What LogiTrack does for you</SectionTitle>
        <p className="mx-auto mt-4 max-w-xl text-lp-ink/70">Everything a delivery business needs, from the first booking to the payment.</p>
        <div className="mt-12 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article key={f.title} className={cn('rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)]', i === 0 && 'lg:row-span-2')}>
              <span className="inline-grid size-11 place-items-center rounded-full border border-lp-peach-deep! bg-linear-to-b from-lp-peach/20 via-lp-peach to-lp-peach-deep/50 shadow-[0_5px_10px_#f58f7d66]">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-5 font-lp-display text-xl font-extrabold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-lp-ink/70">{f.body}</p>
              {i === 0 ? <MiniMap /> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// A small drawn map for the first feature card: route, vehicle, two stops.
function MiniMap() {
  return (
    <svg viewBox="0 0 320 180" className="mt-6 w-full rounded-2xl bg-lp-lavender" aria-hidden>
      <g stroke="#d5cdfe" strokeWidth="1">
        {[30, 70, 110, 150].map((y) => <line key={y} x1="0" x2="320" y1={y} y2={y} />)}
        {[50, 120, 190, 260].map((x) => <line key={x} y1="0" y2="180" x1={x} x2={x} />)}
      </g>
      <path d="M40 150 C 90 140, 80 90, 140 90 S 210 40, 280 35" fill="none" stroke="#6248ff" strokeOpacity=".3" strokeWidth="6" strokeLinecap="round" />
      <path d="M40 150 C 90 140, 80 90, 140 90" fill="none" stroke="#4634b7" strokeWidth="6" strokeLinecap="round" />
      <circle cx="40" cy="150" r="7" fill="#00bea6" stroke="#fff" strokeWidth="3" />
      <circle cx="280" cy="35" r="7" fill="#6248ff" stroke="#fff" strokeWidth="3" />
      <circle cx="140" cy="90" r="16" fill="#6248ff" fillOpacity=".18" />
      <circle cx="140" cy="90" r="8" fill="#6248ff" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

// Tiny UI sketches under each step, in place of screenshots.
const STEP_ART = [
  () => (
    <div className="space-y-2 rounded-t-2xl bg-white p-4 shadow-sm">
      {[['bg-lp-teal', 'Pickup', '12 Allen Avenue, Ikeja'], ['bg-lp-violet', 'Drop-off', '5 Admiralty Way, Lekki']].map(([dot, label, value]) => (
        <div key={label} className="flex items-center gap-3 rounded-xl border border-lp-violet/10! px-3 py-2.5">
          <span className={cn('size-2.5 rounded-full', dot)} />
          <span className="text-left"><span className="block text-[11px] text-lp-ink/50">{label}</span><span className="block text-sm">{value}</span></span>
        </div>
      ))}
      <div className="flex items-center justify-between rounded-xl bg-lp-lavender px-3 py-2.5 text-sm"><span>18 km</span><span className="font-semibold">₦6,400</span></div>
    </div>
  ),
  () => (
    <div className="space-y-2 rounded-t-2xl bg-white p-4 shadow-sm">
      {[['Bisi A.', 'Bike · online', true], ['Emeka O.', 'Van · online', false], ['Kunle A.', 'Car · on a job', false]].map(([name, meta, pick]) => (
        <div key={String(name)} className="flex items-center gap-3 rounded-xl border border-lp-violet/10! px-3 py-2">
          <span className="grid size-8 place-items-center rounded-full bg-lp-cream text-xs font-semibold text-lp-orange">{String(name).slice(0, 1)}</span>
          <span className="flex-1 text-left"><span className="block text-sm">{name}</span><span className="block text-[11px] text-lp-ink/50">{meta}</span></span>
          <span className={cn('rounded-full px-3 py-1 text-xs', pick ? 'bg-lp-violet text-white' : 'border border-lp-violet/15! text-lp-ink/60')}>Assign</span>
        </div>
      ))}
    </div>
  ),
  () => (
    <div className="rounded-t-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between"><span className="font-lp-display text-lg font-extrabold">#2411</span><span className="rounded-full bg-lp-mint px-2.5 py-1 text-xs text-teal-700">Out for delivery</span></div>
      <div className="relative mt-5 flex h-6 items-center">
        <span className="size-3 rounded-full bg-lp-teal" />
        <div className="relative mx-1 h-6 flex-1">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-lp-chip!" />
          <div className="absolute top-1/2 left-0 h-[3px] w-3/4 -translate-y-1/2 rounded-full bg-lp-teal" />
          <span className="absolute top-1/2 left-3/4 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lp-violet text-white"><Truck className="size-3.5" /></span>
        </div>
        <span className="size-3 rounded-full bg-lp-ink" />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-lp-ink/50"><span>Ikeja</span><span>Lekki · 6 min</span></div>
    </div>
  ),
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 px-4 pt-6 pb-16">
      <div className="mx-auto max-w-6xl">
        <SectionTitle className="text-center">Three steps from booking to doorstep</SectionTitle>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Art = STEP_ART[i]!;
            return (
              <article key={s.n} className={cn('flex flex-col gap-4 overflow-hidden rounded-3xl bg-lp-violet/10 px-4 pt-5', i === 2 && 'sm:col-span-2 md:col-span-1')}>
                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-lp-violet-deep">Step {s.n}</span>
                <h3 className="font-lp-display text-2xl font-extrabold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-lp-ink/70">{s.body}</p>
                <div className="mt-auto pt-2"><Art /></div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Roles() {
  return (
    <section id="roles" className="scroll-mt-20 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center rounded-[40px] bg-lp-orange/10 p-6 py-14 text-center md:rounded-[70px] md:p-16">
        <SectionTitle className="max-w-3xl md:text-6xl">One app for everyone in the delivery</SectionTitle>
        <p className="mt-4 max-w-xl text-lp-ink/70">Customers, drivers and your team share one live record of every shipment, and each person sees only what they need.</p>
        <div className="mt-10 grid w-full gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <article key={r.title} className="rounded-3xl bg-white p-5">
              <span className={cn('grid size-12 place-items-center rounded-2xl', r.tint)}><r.icon className="size-5" /></span>
              <h3 className="mt-4 font-lp-display text-xl font-extrabold">{r.title}</h3>
              <p className="mt-1 text-sm text-lp-ink/70">{r.body}</p>
            </article>
          ))}
        </div>
        <Link href="/login" className="group mt-10 inline-flex items-center gap-2 rounded-full bg-lp-coral px-6 py-4 text-sm text-white transition hover:scale-105">
          Log in to LogiTrack<ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
