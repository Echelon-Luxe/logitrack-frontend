'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Brand violet and TalkPadi teal: distinct in hue and lightness, both
// readable against the white surface.
const SERIES = { created: '#6248ff', delivered: '#00a38f' };

const shortDay = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', timeZone: 'UTC' });

interface Row { date: string; created: number; delivered: number }

function ChartTooltip({ active, payload, label, colors }: {
  active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string; colors: Record<string, string>;
}) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-pop)]">
      <p className="mb-1 font-semibold text-fg">{shortDay(label)}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted">
          <span className="size-2 rounded-sm" style={{ background: colors[p.dataKey] }} />
          <span className="flex-1 capitalize">{p.dataKey}</span>
          <span className="font-semibold text-fg tabular-nums">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

/** Shipments created vs delivered per day. Grouped bars, one y-axis. */
export function DailyChart({ data }: { data: Row[] }) {
  const colors = SERIES;
  const totals = data.reduce((a, r) => ({ created: a.created + r.created, delivered: a.delivered + r.delivered }), { created: 0, delivered: 0 });

  return (
    <div>
      {/* Legend: identity never rests on colour alone. */}
      <div className="mb-3 flex flex-wrap gap-4 text-[13px]">
        {(['created', 'delivered'] as const).map((k) => (
          <span key={k} className="flex items-center gap-2 text-muted">
            <span className="size-2.5 rounded-sm" style={{ background: colors[k] }} />
            <span className="capitalize">{k}</span>
            <span className="font-semibold text-fg tabular-nums">{totals[k]}</span>
          </span>
        ))}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis dataKey="date" tickFormatter={shortDay} tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} width={44} />
            <Tooltip cursor={{ fill: 'var(--surface-3)', radius: 6 }} content={<ChartTooltip colors={colors} />} />
            <Bar dataKey="created" fill={colors.created} radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="delivered" fill={colors.delivered} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
