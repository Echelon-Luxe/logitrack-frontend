import { Badge, type BadgeTone } from '@/components/ui/badge';
import { STATUS_LABEL, type ShipmentStatus } from '@/lib/types';

// One hue per stage, so a list scans by colour before it is read:
// amber waiting, sky collected, violet moving, teal arriving, green done.
// Cancelled is rose but muted - a valid outcome, not an error.
export const STATUS_TONE: Record<ShipmentStatus, BadgeTone> = {
  CREATED: 'amber',
  PICKED_UP: 'sky',
  IN_TRANSIT: 'violet',
  OUT_FOR_DELIVERY: 'teal',
  DELIVERED: 'green',
  CANCELLED: 'rose',
};

// Solid colours for the same stages, for map markers, chart series and rails.
export const STATUS_COLOR: Record<ShipmentStatus, string> = {
  CREATED: 'oklch(0.75 0.15 70)',
  PICKED_UP: 'oklch(0.68 0.14 230)',
  IN_TRANSIT: 'oklch(0.58 0.2 290)',
  OUT_FOR_DELIVERY: 'oklch(0.62 0.12 180)',
  DELIVERED: 'oklch(0.62 0.15 155)',
  CANCELLED: 'oklch(0.62 0.17 15)',
};

export const StatusBadge = ({ status, size, className }: { status: ShipmentStatus; size?: 'sm' | 'md'; className?: string }) => (
  <Badge tone={STATUS_TONE[status]} size={size ?? 'md'} className={className}>
    {STATUS_LABEL[status] ?? status}
  </Badge>
);
