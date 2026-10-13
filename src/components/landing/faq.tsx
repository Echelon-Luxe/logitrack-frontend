'use client';

import { Plus } from 'lucide-react';
import { FAQS } from './content';
import { Reveal } from './motion';

// Native <details>: keyboard and screen-reader friendly. The open/close
// height animation is CSS (.lp-faq in globals.css) where browsers support it.
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 px-4 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <Reveal as="h2" className="font-lp-display text-4xl font-extrabold tracking-tight md:text-5xl xl:text-6xl">Questions, answered</Reveal>
          <Reveal as="p" y={20} delay={0.1} className="mt-4 max-w-sm text-lp-ink/70">Can’t find what you need? Your LogiTrack administrator can help.</Reveal>
        </div>
        <div className="divide-y divide-lp-violet/10! border-y border-lp-violet/10!">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} y={20} delay={i * 0.06}>
              <details className="lp-faq group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-lp-display text-lg font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lp-lavender text-lp-violet-deep transition duration-300 group-open:rotate-45 group-open:bg-lp-violet group-open:text-white">
                    <Plus className="size-4" />
                  </span>
                </summary>
                <p className="mt-3 pr-12 text-sm leading-relaxed text-lp-ink/70 group-open:animate-fade-up">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
