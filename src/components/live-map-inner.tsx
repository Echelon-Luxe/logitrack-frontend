'use client';

import * as React from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Tooltip } from 'react-leaflet';
import { fetchRoute, splitRoute, type LatLng } from '@/lib/geo';

export interface FleetDot {
  id: string;
  position: LatLng;
  label: string;
  color: string;
  onClick?: () => void;
}

export interface LiveMapProps {
  from?: LatLng | null;
  to?: LatLng | null;
  vehicle?: { position: LatLng; heading?: number | null } | null;
  // Driven-so-far breadcrumbs from the tracking service.
  trail?: LatLng[];
  fleet?: FleetDot[];
  // Change to refit the view (e.g. a different shipment selected).
  fitKey?: string;
  showLabels?: boolean;
  interactive?: boolean;
  // Extra space kept clear at the bottom when fitting, for overlaid panels.
  padBottom?: number;
  className?: string;
  onRoute?: (route: LatLng[]) => void;
}

const LAGOS: LatLng = [6.5244, 3.3792];

// Stadia's Alidade Smooth: quiet enough to put data on top of, and keyless
// for localhost development. A deployed site needs a Stadia API key (or any
// other XYZ provider) - set the URL through this env var.
const TILES = process.env['NEXT_PUBLIC_MAP_TILES'] ?? 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
const ATTRIBUTION = '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const pin = (label: string | null, tone: 'pickup' | 'dropoff') =>
  L.divIcon({
    className: 'lt-marker',
    iconSize: [0, 0],
    html: `
      <div style="position:relative;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:6px;">
        ${label && tone === 'pickup' ? `<div style="order:-1;padding:6px 12px;border-radius:999px;background:var(--surface);color:var(--text);font:600 13px var(--font-sans);box-shadow:var(--shadow-pop);border:1px solid var(--border);white-space:nowrap;margin-bottom:2px">${label}</div>` : ''}
        <div style="width:22px;height:22px;border-radius:999px;background:color-mix(in oklch, var(--brand) 25%, transparent);display:grid;place-items:center">
          <div style="width:12px;height:12px;border-radius:999px;background:var(--brand);border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.3)"></div>
        </div>
        ${label && tone === 'dropoff' ? `<div style="padding:6px 12px;border-radius:999px;background:var(--surface);color:var(--text);font:600 13px var(--font-sans);box-shadow:var(--shadow-pop);border:1px solid var(--border);white-space:nowrap;margin-top:2px">${label}</div>` : ''}
      </div>`,
  });

const truckIcon = (heading: number) =>
  L.divIcon({
    className: 'lt-marker',
    iconSize: [0, 0],
    html: `
      <div style="position:relative;transform:translate(-50%,-50%);width:76px;height:76px;display:grid;place-items:center">
        <span style="position:absolute;inset:0;border-radius:999px;background:color-mix(in oklch, var(--brand) 22%, transparent);animation:var(--animate-pulse-ring)"></span>
        <span style="position:absolute;inset:12px;border-radius:999px;background:color-mix(in oklch, var(--brand) 18%, transparent)"></span>
        <div style="position:absolute;inset:0;transform:rotate(${Math.round(heading)}deg)">
          <span style="position:absolute;top:6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:9px solid var(--brand-strong)"></span>
        </div>
        <div style="position:relative;width:36px;height:36px;border-radius:999px;background:var(--surface);box-shadow:var(--shadow-pop);display:grid;place-items:center;border:1px solid var(--border)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
        </div>
      </div>`,
  });

const dotIcon = (color: string) =>
  L.divIcon({
    className: 'lt-marker',
    iconSize: [0, 0],
    html: `<div style="transform:translate(-50%,-50%);width:28px;height:28px;border-radius:999px;background:color-mix(in oklch, ${color} 25%, transparent);display:grid;place-items:center"><div style="width:14px;height:14px;border-radius:999px;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.35)"></div></div>`,
  });

function FitBounds({ points, fitKey, padBottom }: { points: LatLng[]; fitKey: string | undefined; padBottom: number }) {
  const map = useMap();
  const last = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (points.length === 0) return;
    // Refit only when the subject changes, not on every location ping -
    // otherwise the map fights a user who has panned away.
    const key = `${fitKey}:${points.length > 1 ? 'many' : 'one'}`;
    if (last.current === key) return;
    last.current = key;
    if (points.length === 1) map.setView(points[0]!, 15, { animate: true });
    else map.fitBounds(L.latLngBounds(points), { paddingTopLeft: [56, 64], paddingBottomRight: [56, padBottom], maxZoom: 15, animate: true });
  }, [map, points, fitKey, padBottom]);
  return null;
}

// Leaflet measures its container once; a sidebar collapsing or a panel
// resizing would otherwise leave grey tiles.
function ResizeWatcher() {
  const map = useMap();
  React.useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [map]);
  return null;
}

export default function LiveMapInner({
  from, to, vehicle, trail, fleet, fitKey, showLabels = true, interactive = true, padBottom = 64, className, onRoute,
}: LiveMapProps) {
  const key = from && to ? `${from[0]},${from[1]}>${to[0]},${to[1]}` : null;
  const [fetched, setFetched] = React.useState<{ key: string; route: LatLng[] } | null>(null);
  // Straight line until the road route arrives for these exact endpoints.
  const route = React.useMemo<LatLng[]>(
    () => (!key || !from || !to ? [] : fetched?.key === key ? fetched.route : [from, to]),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key encodes from/to
    [key, fetched],
  );
  const onRouteRef = React.useRef(onRoute);
  React.useEffect(() => { onRouteRef.current = onRoute; }, [onRoute]);

  React.useEffect(() => {
    if (!key || !from || !to) return;
    let cancelled = false;
    void fetchRoute(from, to).then((r) => {
      if (cancelled) return;
      setFetched({ key, route: r });
      onRouteRef.current?.(r);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the endpoints move
  }, [key]);

  const [travelled, ahead] = React.useMemo(
    () => splitRoute(route, vehicle?.position ?? null),
    [route, vehicle?.position],
  );

  const fitPoints = React.useMemo<LatLng[]>(() => {
    if (route.length > 1) return route;
    if (fleet?.length) return fleet.map((f) => f.position);
    return vehicle ? [vehicle.position] : [];
  }, [route, fleet, vehicle]);

  return (
    <MapContainer
      center={from ?? fleet?.[0]?.position ?? LAGOS}
      zoom={12}
      className={className}
      zoomControl={interactive}
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      attributionControl
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} />
      <ResizeWatcher />
      <FitBounds points={fitPoints} fitKey={fitKey} padBottom={padBottom} />

      {/* className is a constructor option: react-leaflet applies pathOptions
          with setStyle(), which never sets the class. */}
      {ahead.length > 1 ? (
        <Polyline positions={ahead} className="lt-route-ahead-line" pathOptions={{ weight: 5, lineCap: 'round', lineJoin: 'round' }} />
      ) : null}
      {trail && trail.length > 1 ? (
        <Polyline positions={trail} className="lt-route-trail" pathOptions={{ weight: 3, dashArray: '2 8', lineCap: 'round' }} />
      ) : null}
      {travelled.length > 1 ? (
        <Polyline positions={travelled} className="lt-route-done" pathOptions={{ weight: 6, lineCap: 'round', lineJoin: 'round' }} />
      ) : null}

      {from ? <Marker position={from} icon={pin(showLabels ? 'Pickup' : null, 'pickup')} /> : null}
      {to ? <Marker position={to} icon={pin(showLabels ? 'Dropoff' : null, 'dropoff')} /> : null}

      {fleet?.map((f) => (
        <Marker
          key={f.id}
          position={f.position}
          icon={dotIcon(f.color)}
          eventHandlers={f.onClick ? { click: f.onClick } : {}}
        >
          <Tooltip direction="top" offset={[0, -12]}>{f.label}</Tooltip>
        </Marker>
      ))}

      {vehicle ? (
        <Marker position={vehicle.position} icon={truckIcon(vehicle.heading ?? 0)} zIndexOffset={1000} />
      ) : null}
    </MapContainer>
  );
}
