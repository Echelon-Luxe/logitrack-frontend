'use client';

import { Package } from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';
import { ProgressRail } from '@/components/progress-rail';
import { ContactRow } from '@/components/contact-row';
import { cn } from '@/lib/utils';
import type { Role, Shipment } from '@/lib/types';

/**
 * The tracking list card: reference and status, a progress rail between the
 * two addresses, and the person the viewer most likely needs to reach - the
 * driver for a customer, the customer for everyone else.
 */
export function ShipmentCard({ shipment: s, viewerRole, selected, progress, onSelect }: {
  shipment: Shipment;
  viewerRole: Role;
  selected?: boolean;
  progress?: number | null;
  onSelect?: () => void;
}) {
  const showDriver = viewerRole === 'CUSTOMER';
  const contact = showDriver
    ? s.driverName
      ? { name: s.driverName, role: 'Driver', phone: s.driverPhone, email: null }
      : null
    : { name: s.customerName || 'Customer', role: 'Customer', phone: s.customerPhone, email: s.customerEmail };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); }
      }}
      className={cn(
        'group cursor-pointer rounded-3xl border bg-surface p-5 transition-colors outline-none',
        'hover:border-line-strong focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'border-brand bg-lavender/40 ring-1 ring-brand' : 'border-line',
      )}
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-lavender text-brand-strong">
            <Package className="size-4" />
          </span>
          <span className="truncate font-display text-lg font-extrabold tracking-tight tabular-nums">#{s.reference.replace(/^LT-/, '')}</span>
        </div>
        <StatusBadge status={s.status} />
      </header>

      <ProgressRail status={s.status} progress={progress} className="mt-5" />

      <div className="mt-3 grid grid-cols-2 gap-4 text-[13px] leading-snug text-muted">
        <p className="line-clamp-2">{s.origin}</p>
        <p className="line-clamp-2 text-right">{s.destination}</p>
      </div>

      {contact ? (
        <>
          <div className="my-4 border-t border-line" />
          <ContactRow name={contact.name} role={contact.role} phone={contact.phone} email={contact.email} />
        </>
      ) : showDriver ? (
        <>
          <div className="my-4 border-t border-line" />
          <p className="text-[13px] text-muted">Waiting for a driver to be assigned…</p>
        </>
      ) : null}
    </article>
  );
}
