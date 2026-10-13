import { Mail, Phone } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { telHref } from '@/lib/format';
import { cn } from '@/lib/utils';

// Avatar, name, role and quick call/email actions. Buttons are real links so
// they open the phone dialler or mail client, and are hidden when the contact
// has no number or address.
export function ContactRow({ name, role, phone, email, className }: {
  name: string; role: string; phone?: string | null; email?: string | null; className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name || 'Unknown'}</p>
        <p className="text-xs text-muted">{role}</p>
      </div>
      <div className="flex gap-2">
        {phone ? (
          <a
            href={telHref(phone)}
            onClick={(e) => e.stopPropagation()}
            className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-fg shadow-[0_1px_1px_oklch(0_0_0/0.03)] transition hover:border-line-strong hover:bg-surface-3"
            aria-label={`Call ${name}`}
            title={phone}
          >
            <Phone className="size-4" />
          </a>
        ) : null}
        {email ? (
          <a
            href={`mailto:${email}`}
            onClick={(e) => e.stopPropagation()}
            className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-fg shadow-[0_1px_1px_oklch(0_0_0/0.03)] transition hover:border-line-strong hover:bg-surface-3"
            aria-label={`Email ${name}`}
            title={email}
          >
            <Mail className="size-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
