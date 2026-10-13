'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';
import { HERO_MESSAGES } from './content';
import { BlurWords, EASE, Sparkle } from './motion';

const HEADLINE = 'Every parcel, tracked to the doorstep';

type Message = (typeof HERO_MESSAGES)[number];

/**
 * A chat-style update: the source badge springs up first, then the bubble
 * pops out under it, then the pair keeps bobbing gently.
 */
function Bubble({ m, delay, rise, compact = false, sparkSide = 'right', className }: {
  m: Message; delay: number; rise: number; compact?: boolean; sparkSide?: 'left' | 'right'; className?: string;
}) {
  const Icon = m.icon;
  return (
    <motion.div
      className={cn('relative flex w-max flex-col', compact ? 'items-center' : sparkSide === 'left' ? 'items-end' : 'items-start', className)}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity, delay: delay + 1.2 }}
      aria-hidden
    >
      <motion.span
        className={cn('grid place-items-center rounded-full text-white shadow-lg ring-4 ring-white', m.badge, compact ? 'size-9' : 'size-12')}
        initial={{ opacity: 0, scale: 0, y: rise }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay }}
      >
        <Icon className={compact ? 'size-4' : 'size-5'} />
      </motion.span>
      <div className="relative mt-3">
        <motion.p
          className={cn(
            'rounded-l-2xl rounded-br-2xl border border-white! text-left text-lp-ink shadow-2xl shadow-black/15',
            m.bubble,
            compact ? 'max-w-[13rem] px-3 py-2.5 text-xs leading-snug' : 'max-w-[15rem] px-4 py-3.5 text-[15px] leading-snug',
          )}
          initial={{ opacity: 0, y: 24, scale: 0.6, rotate: 0 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: m.tilt }}
          transition={{ type: 'spring', stiffness: 220, damping: 20, delay: delay + 0.25 }}
        >
          {m.text}
        </motion.p>
        {!compact ? (
          <motion.span
            className={cn('absolute -top-4', sparkSide === 'right' ? '-right-10' : '-left-10', m.spark)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16, delay: delay + 0.45 }}
          >
            <Sparkle />
          </motion.span>
        ) : null}
      </div>
    </motion.div>
  );
}

/** Dashboard screenshot tipped back in 3D that flattens as it scrolls in. */
function TiltedDashboard() {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const spring = { stiffness: 120, damping: 26, mass: 0.6 };
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 1], [35, 0]), spring);
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.92, 1]), spring);

  return (
    <div ref={ref} className="[perspective:1200px]">
      <motion.div
        className="lp-glow mx-auto max-w-5xl"
        style={reduce ? undefined : { rotateX, scale, transformOrigin: 'center top' }}
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.8 }}
      >
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
      </motion.div>
    </div>
  );
}

export function Hero() {
  const [m0, m1, m2, m3] = HERO_MESSAGES as [Message, Message, Message, Message];
  return (
    <section className="relative overflow-x-clip pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* Faint violet and peach wash behind the headline. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(60%_50%_at_20%_10%,#f2f0ff_0%,transparent_70%),radial-gradient(50%_45%_at_85%_15%,#fef4ee_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Wide screens: updates pop in on both sides of the headline. */}
        <div className="pointer-events-none absolute inset-x-6 top-0 hidden h-[30rem] xl:block">
          <Bubble m={m0} delay={1.0} rise={60} className="absolute top-0 left-0" />
          <Bubble m={m1} delay={1.5} rise={85} className="absolute top-[56%] left-8" />
          <Bubble m={m2} delay={1.25} rise={40} sparkSide="left" className="absolute top-8 right-0" />
          <Bubble m={m3} delay={1.75} rise={70} sparkSide="left" className="absolute top-[60%] right-8" />
        </div>

        <div className="flex flex-col items-center text-center">
          <h1 className="max-w-4xl font-lp-display text-[44px] leading-[1.02] font-extrabold tracking-tight sm:text-6xl lg:text-7xl xl:max-w-[40rem]">
            <BlurWords text={HEADLINE} delay={0.1} />
          </h1>
          <motion.p
            className="mt-6 max-w-2xl text-base text-lp-ink/70 sm:text-lg xl:max-w-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
          >
            LogiTrack brings your bookings, drivers, payments and customers into one live view. Fewer phone calls, no lost parcels.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
          >
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
          </motion.div>

          {/* Smaller screens: two updates in a row above the screenshot. */}
          <div className="mt-12 flex flex-wrap items-end justify-center gap-4 xl:hidden">
            <Bubble m={m0} delay={1.0} rise={40} compact />
            <Bubble m={m2} delay={1.3} rise={60} compact />
          </div>
        </div>

        <div className="mt-10 xl:mt-28">
          <TiltedDashboard />
        </div>
      </div>
    </section>
  );
}
