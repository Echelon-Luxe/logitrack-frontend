const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 minutes ago", "yesterday". Falls back to "just now" under a minute. */
export function timeAgo(iso: string | Date, now = Date.now()): string {
  const seconds = (new Date(iso).getTime() - now) / 1000;
  for (const [unit, size] of STEPS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export const formatDate = (iso: string | Date): string =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso: string | Date): string =>
  new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const formatTime = (iso: string | Date): string =>
  new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '')).toUpperCase();
}

/** Splits "Street, Area, City" into a bold first line and a muted rest. */
export function splitAddress(address: string): [string, string] {
  const i = address.indexOf(',');
  return i === -1 ? [address, ''] : [address.slice(0, i).trim(), address.slice(i + 1).trim()];
}

// tel: links need digits only; display keeps the spacing people typed.
export const telHref = (phone: string): string => `tel:${phone.replace(/[^\d+]/g, '')}`;
