'use client';

import * as React from 'react';
import { Loader2, MapPin, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface Place {
  label: string;
  lat: number;
  lng: number;
}

// Shown before anyone types, and the fallback when geocoding is unreachable,
// so the form always works offline.
export const POPULAR_PLACES: Place[] = [
  { label: 'Ikeja City Mall, Obafemi Awolowo Way, Ikeja', lat: 6.6142, lng: 3.3581 },
  { label: 'Admiralty Way, Lekki Phase 1', lat: 6.4474, lng: 3.4723 },
  { label: 'Adeola Odeku St, Victoria Island', lat: 6.4305, lng: 3.4216 },
  { label: 'Herbert Macaulay Way, Yaba', lat: 6.5095, lng: 3.3711 },
  { label: 'Adeniran Ogunsanya St, Surulere', lat: 6.4926, lng: 3.3553 },
  { label: 'Lekki-Epe Expressway, Ajah', lat: 6.4682, lng: 3.5852 },
  { label: 'Maryland Mall, Ikorodu Rd, Maryland', lat: 6.5714, lng: 3.3672 },
  { label: 'Awolowo Rd, Ikoyi', lat: 6.4479, lng: 3.4344 },
  { label: 'Murtala Muhammed Airport, Ikeja', lat: 6.5774, lng: 3.3215 },
  { label: 'Diya St, Gbagada', lat: 6.548, lng: 3.3878 },
];

// OpenStreetMap's public geocoder. Its usage policy allows light interactive
// use: debounced, at most one request a second, biased to Lagos.
const NOMINATIM = process.env['NEXT_PUBLIC_GEOCODER_URL'] ?? 'https://nominatim.openstreetmap.org';

async function geocode(q: string, signal: AbortSignal): Promise<Place[]> {
  const url = `${NOMINATIM}/search?format=jsonv2&limit=6&countrycodes=ng&viewbox=3.0,6.8,3.8,6.3&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { 'accept-language': 'en' } });
  if (!res.ok) throw new Error(String(res.status));
  const rows = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return rows.map((r) => ({
    // The full display name is a paragraph; the first four parts identify the place.
    label: r.display_name.split(',').slice(0, 4).join(',').trim(),
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));
}

export function AddressAutocomplete({ id, value, onChange, placeholder, tone }: {
  id: string;
  value: Place | null;
  onChange: (p: Place | null) => void;
  placeholder: string;
  tone: 'pickup' | 'dropoff';
}) {
  const [text, setText] = React.useState(value?.label ?? '');
  const [open, setOpen] = React.useState(false);
  const [results, setResults] = React.useState<Place[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Follow external changes to the value (e.g. the Swap button) by adjusting
  // state during render - React's recommended alternative to a syncing effect.
  const [seenLabel, setSeenLabel] = React.useState(value?.label);
  if (value?.label !== seenLabel) {
    setSeenLabel(value?.label);
    setText(value?.label ?? '');
  }

  const q = text.trim();
  const searching = open && q.length >= 3 && q !== value?.label;

  React.useEffect(() => {
    if (!searching) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      geocode(q, ctl.signal)
        .then((r) => { setResults(r); setActive(0); })
        .catch(() => {
          if (ctl.signal.aborted) return;
          // Offline: filter the built-in places instead.
          setResults(POPULAR_PLACES.filter((p) => p.label.toLowerCase().includes(q.toLowerCase())));
        })
        .finally(() => { if (!ctl.signal.aborted) setLoading(false); });
    }, 450);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q, searching]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const options = q.length < 3 ? POPULAR_PLACES : searching ? results : [];
  const choose = (p: Place) => { onChange(p); setText(p.label); setOpen(false); };

  return (
    <div ref={boxRef} className="relative">
      <span className={cn('pointer-events-none absolute top-1/2 left-3 size-2.5 -translate-y-1/2 rounded-full ring-4', tone === 'pickup' ? 'bg-emerald-500 ring-emerald-500/15' : 'bg-brand ring-brand/15')} />
      <Input
        id={id}
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        className="pl-9"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          if (value && e.target.value !== value.label) onChange(null);
        }}
        onKeyDown={(e) => {
          if (!open || !options.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % options.length); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + options.length) % options.length); }
          if (e.key === 'Enter') { e.preventDefault(); const o = options[active]; if (o) choose(o); }
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {loading && searching ? <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-faint" /> : null}
      {open && options.length > 0 ? (
        <ul id={`${id}-list`} role="listbox" className="scroll-thin absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-2xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
          {text.trim().length < 3 ? <li className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-faint uppercase">Popular in Lagos</li> : null}
          {options.map((p, i) => (
            <li
              key={`${p.lat},${p.lng},${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(p); }}
              className={cn('flex cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2 text-sm', i === active && 'bg-surface-3')}
            >
              {text.trim().length < 3 ? <Star className="mt-0.5 size-4 shrink-0 text-faint" /> : <MapPin className="mt-0.5 size-4 shrink-0 text-faint" />}
              <span>{p.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
