'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Logo } from '@/components/logo';
import { NAV_LINKS } from './content';
import { EASE } from './motion';

export function ClosingCta() {
  return (
    <section className="px-4 pt-16 pb-10">
      <div className="relative mx-auto max-w-6xl">
        {/* Two tabs peeking out above the band, as on talkpadi.com. */}
        <motion.div
          className="absolute inset-x-0 -top-6 mx-auto h-24 w-[90%] rounded-t-[40px] bg-lp-coral/10 md:rounded-t-[60px]"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
          aria-hidden
        />
        <motion.div
          className="absolute inset-x-0 -top-3 mx-auto h-24 w-[95%] rounded-t-[40px] bg-[#f9d2cb] md:rounded-t-[60px]"
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.18 }}
          aria-hidden
        />
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative flex min-h-96 flex-col items-center justify-center rounded-[40px] bg-linear-to-br from-lp-coral to-lp-coral-deep px-6 py-16 text-center md:min-h-[30rem] md:rounded-[60px]">
          <h2 className="max-w-3xl font-lp-display text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl">
            Book your next delivery and watch it arrive
          </h2>
          <p className="mt-4 max-w-lg text-white/85">Sign in to book a shipment, pick up a job or run dispatch.</p>
          <Link href="/login" className="mt-8 w-fit rounded-full bg-linear-to-b from-white to-[#e8e8e8] px-12 py-5 text-sm font-medium text-black transition-transform hover:scale-105">
            Log in
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="p-4 md:p-6">
      <div className="flex flex-col overflow-hidden rounded-3xl bg-lp-panel">
        <div className="grid gap-10 px-6 pt-10 md:grid-cols-[2fr_1fr_1fr] md:px-10">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-lp-ink/60">Delivery tracking and logistics operations for Lagos businesses.</p>
          </div>
          <nav aria-label="Product" className="space-y-3 text-sm">
            <p className="font-semibold">Product</p>
            {NAV_LINKS.map((l) => <a key={l.href} href={l.href} className="block text-lp-ink/70 transition hover:text-lp-ink">{l.label}</a>)}
          </nav>
          <nav aria-label="Account" className="space-y-3 text-sm">
            <p className="font-semibold">Account</p>
            <Link href="/login" className="block text-lp-ink/70 transition hover:text-lp-ink">Log in</Link>
            <Link href="/login" className="block text-lp-ink/70 transition hover:text-lp-ink">Create an account</Link>
          </nav>
        </div>
        <div className="mx-6 my-8 h-px bg-lp-ink/10 md:mx-10" />
        <p className="px-6 text-xs text-lp-ink/50 md:px-10">© {new Date().getFullYear()} LogiTrack</p>
        {/* Oversized wordmark, sliding up into the panel. */}
        {/* The trigger is the clipping box: the word itself starts fully
            clipped, so it would never count as in view. */}
        <motion.div className="overflow-hidden" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          <motion.p
            className="mt-4 -mb-[3%] w-full bg-linear-to-b from-lp-ink/15 via-lp-ink/8 to-transparent bg-clip-text text-center font-lp-display text-[21vw] leading-[0.8] font-extrabold tracking-tighter text-transparent select-none"
            variants={{ hidden: { y: '100%' }, show: { y: 0, transition: { duration: 1, ease: EASE } } }}
            aria-hidden
          >
            LogiTrack
          </motion.p>
        </motion.div>
      </div>
    </footer>
  );
}
