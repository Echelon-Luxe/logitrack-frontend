import { Plus } from 'lucide-react';
import { FAQS } from './content';

// Native <details>: keyboard and screen-reader friendly with no script.
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 px-4 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-lp-display text-4xl font-extrabold tracking-tight md:text-5xl xl:text-6xl">Questions, answered</h2>
          <p className="mt-4 max-w-sm text-lp-ink/70">Can’t find what you need? Your LogiTrack administrator can help.</p>
        </div>
        <div className="divide-y divide-lp-violet/10! border-y border-lp-violet/10!">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-lp-display text-lg font-bold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-lp-lavender text-lp-violet-deep transition group-open:rotate-45">
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="mt-3 pr-12 text-sm leading-relaxed text-lp-ink/70">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
