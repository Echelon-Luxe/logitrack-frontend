import type { Metadata } from 'next';
import { LifeBuoy, Mail, MapPin, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { PageContainer } from '@/components/app-shell';
import { PageHeader } from '@/components/page-header';

export const metadata: Metadata = { title: 'Help & Support' };

const FAQ = [
  { icon: MapPin, q: 'How does live tracking work?', a: 'Once a driver picks up your parcel, their position streams to the map in real time. Open Tracking and select the shipment to follow it, with ETA and distance remaining.' },
  { icon: CreditCard, q: 'When do I pay?', a: 'The price is fixed when you book. Pay any time before delivery from the shipment page - you will see a Paid badge once it settles.' },
  { icon: Truck, q: 'I signed up as a driver. Why can’t I go online?', a: 'New drivers are reviewed by dispatch first. As soon as you are approved, the Online toggle on My jobs unlocks.' },
  { icon: ShieldCheck, q: 'Why can’t I see a page or button?', a: 'What you see depends on your role. Customers see their own shipments, drivers their assigned jobs, and staff roles see more. An admin can change your role.' },
];

export default function HelpPage() {
  return (
    <PageContainer className="max-w-3xl">
      <PageHeader title="Help & Support" description="Answers to common questions, and how to reach us." />
      <div className="space-y-3">
        {FAQ.map((f) => (
          <details key={f.q} className="group rounded-xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] open:pb-5">
            <summary className="flex cursor-pointer list-none items-center gap-3 font-semibold">
              <span className="grid place-items-center rounded-lg border border-line bg-surface text-muted size-9"><f.icon className="size-4" /></span>
              <span className="flex-1">{f.q}</span>
              <span className="text-faint transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 pl-12 text-sm leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="flex items-center gap-4 rounded-xl border border-line bg-surface-2 p-5">
        <LifeBuoy className="size-6 text-muted" />
        <div className="flex-1">
          <p className="font-semibold">Still stuck?</p>
          <p className="text-sm text-muted">Our support team reads every message.</p>
        </div>
        <a href="mailto:support@logitrack.local" className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-medium text-white hover:bg-ink-hover"><Mail className="size-4" />Email support</a>
      </div>
    </PageContainer>
  );
}
