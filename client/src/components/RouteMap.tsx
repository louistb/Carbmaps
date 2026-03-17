import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPoint, SegmentPacing, ClimbData } from '../types/analysis';

// ── Design tokens (mirrored from globals.css) ─────────────────────────────────

const GOLD       = '#C9A96E';
const GOLD_DARK  = '#A8853E';
const TEXT       = '#1A1A18';
const MUTED      = '#A8998C';
const BORDER     = '#E0D6C8';
const BG         = '#F4EDE3';
const RAL        = "'Raleway', sans-serif";

// Warm tile: CartoDB Voyager — neutral but warmer than light_all
const TILE_URL   = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR  = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>';

// ── Colour helpers ─────────────────────────────────────────────────────────────

// Warm brown scale: light = easy, dark = hard  (matches PacingTab ZONES)
function effortColor(pct: number): string {
  if (pct < 55) return '#E8DDD0';
  if (pct < 65) return '#C8B89A';
  if (pct < 75) return '#A8946A';
  if (pct < 85) return '#7A6040';
  if (pct < 95) return '#4A3420';
  return '#1A1A18';
}

// Warm elevation shading: low = sandy, high = dark brown
function elevColor(t: number): string {
  if (t < 0.25) return '#D4C4A8';
  if (t < 0.55) return '#B09060';
  if (t < 0.80) return '#7A6040';
  return '#3A2810';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function closestPoint(points: MapPoint[], km: number): MapPoint {
  return points.reduce((best, p) =>
    Math.abs(p.distanceKm - km) < Math.abs(best.distanceKm - km) ? p : best
  );
}

function pointsBetween(points: MapPoint[], startKm: number, endKm: number): MapPoint[] {
  return points.filter(p => p.distanceKm >= startKm && p.distanceKm <= endKm);
}

// Shared Leaflet map options
const MAP_OPTS: L.MapOptions = {
  scrollWheelZoom: false,
  zoomControl: true,
  attributionControl: true,
};

// ── PacingMap ──────────────────────────────────────────────────────────────────

interface PacingMapProps {
  points: MapPoint[];
  segments: SegmentPacing[];
  hoveredKm: number | null;
}

export function PacingMap({ points, segments, hoveredKm }: PacingMapProps) {
  const ref       = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!ref.current || points.length < 2) return;

    const map = L.map(ref.current, MAP_OPTS);
    mapRef.current = map;

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);

    for (const seg of segments) {
      const pts = pointsBetween(points, seg.startKm, seg.endKm);
      if (pts.length < 2) continue;
      L.polyline(pts.map(p => [p.lat, p.lon] as L.LatLngTuple), {
        color: effortColor(seg.targetPowerPct),
        weight: 5,
        opacity: 0.92,
      }).addTo(map);
    }

    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon] as L.LatLngTuple));
    const tid = setTimeout(() => {
      if (!mapRef.current) return;
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [24, 24] });
    }, 250);

    return () => { clearTimeout(tid); map.remove(); mapRef.current = null; };
  }, [points, segments]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.remove();
    markerRef.current = null;
    if (hoveredKm === null) return;
    const pt = closestPoint(points, hoveredKm);
    markerRef.current = L.circleMarker([pt.lat, pt.lon], {
      radius: 8,
      fillColor: GOLD,
      color: '#fff',
      weight: 2.5,
      fillOpacity: 1,
    }).addTo(map);
  }, [hoveredKm, points]);

  if (points.length < 2) return null;
  return <div ref={ref} style={{ width: '100%', height: 260 }} />;
}

// ── ClimbsMap ─────────────────────────────────────────────────────────────────

interface ClimbsMapProps {
  points: MapPoint[];
  climbs: ClimbData[];
  hoveredClimbIdx: number | null;
}

export function ClimbsMap({ points, climbs, hoveredClimbIdx }: ClimbsMapProps) {
  const ref          = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markerRef    = useRef<L.CircleMarker | null>(null);
  const highlightRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!ref.current || points.length < 2) return;

    const map = L.map(ref.current, MAP_OPTS);
    mapRef.current = map;

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);

    // Base route coloured by elevation
    const elevs  = points.map(p => p.elevationM);
    const minE   = Math.min(...elevs);
    const maxE   = Math.max(...elevs);
    const range  = maxE - minE || 1;
    const CHUNK  = 10;
    for (let i = 0; i < points.length - 1; i += CHUNK) {
      const chunk = points.slice(i, Math.min(i + CHUNK + 1, points.length));
      if (chunk.length < 2) continue;
      const avgE = chunk.reduce((s, p) => s + p.elevationM, 0) / chunk.length;
      L.polyline(chunk.map(p => [p.lat, p.lon] as L.LatLngTuple), {
        color: elevColor((avgE - minE) / range),
        weight: 4,
        opacity: 0.85,
      }).addTo(map);
    }

    // Climb start dots — gold
    for (const climb of climbs) {
      const pt = closestPoint(points, climb.startKm);
      L.circleMarker([pt.lat, pt.lon], {
        radius: 6,
        fillColor: GOLD,
        color: '#fff',
        weight: 2,
        fillOpacity: 1,
      })
        .bindTooltip(`<span style="font-family:${RAL};font-size:12px;font-weight:700;color:${TEXT}">${climb.name}</span>`, {
          permanent: false,
          direction: 'top',
          className: 'carto-tooltip',
        })
        .addTo(map);
    }

    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon] as L.LatLngTuple));
    const tid = setTimeout(() => {
      if (!mapRef.current) return;
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [24, 24] });
    }, 250);

    return () => { clearTimeout(tid); map.remove(); mapRef.current = null; };
  }, [points, climbs]);

  // Highlight hovered climb
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.remove();
    markerRef.current = null;
    highlightRef.current?.remove();
    highlightRef.current = null;
    if (hoveredClimbIdx === null) return;

    const climb = climbs[hoveredClimbIdx];
    if (!climb) return;

    const pts = pointsBetween(points, climb.startKm, climb.startKm + climb.lengthKm);
    if (pts.length >= 2) {
      highlightRef.current = L.polyline(pts.map(p => [p.lat, p.lon] as L.LatLngTuple), {
        color: GOLD,
        weight: 6,
        opacity: 1,
      }).addTo(map);
    }

    const pt = closestPoint(points, climb.startKm);
    markerRef.current = L.circleMarker([pt.lat, pt.lon], {
      radius: 10,
      fillColor: GOLD_DARK,
      color: '#fff',
      weight: 2.5,
      fillOpacity: 1,
    }).addTo(map);
  }, [hoveredClimbIdx, points, climbs]);

  if (points.length < 2) return null;
  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 260 }} />;
}

// ── NutritionMap ──────────────────────────────────────────────────────────────

interface Restaurant {
  id: number;
  lat: number;
  lon: number;
  name: string;
  type: string;
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isNearRoute(lat: number, lon: number, points: MapPoint[], thresholdM = 500): boolean {
  for (let i = 0; i < points.length; i += 5) {
    if (haversineM(lat, lon, points[i].lat, points[i].lon) < thresholdM) return true;
  }
  return false;
}

const AMENITY_LABEL: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  fast_food: 'Fast food',
  bakery: 'Bakery',
};

const AMENITY_COLOR: Record<string, string> = {
  restaurant: GOLD,
  cafe:       '#A8946A',
  fast_food:  '#C8B89A',
  bakery:     GOLD_DARK,
};

interface NutritionMapProps {
  points: MapPoint[];
}

export function NutritionMap({ points }: NutritionMapProps) {
  const ref       = useRef<HTMLDivElement>(null);
  const mapRef    = useRef<L.Map | null>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [count, setCount]   = useState(0);

  // Initialise map (no fetch)
  useEffect(() => {
    if (!ref.current || points.length < 2) return;

    const map = L.map(ref.current, MAP_OPTS);
    mapRef.current = map;

    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);

    L.polyline(points.map(p => [p.lat, p.lon] as L.LatLngTuple), {
      color: '#A8946A',
      weight: 3.5,
      opacity: 0.75,
    }).addTo(map);

    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon] as L.LatLngTuple));
    const tid = setTimeout(() => {
      if (!mapRef.current) return;
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [24, 24] });
    }, 250);

    return () => { clearTimeout(tid); abortRef.current?.abort(); map.remove(); mapRef.current = null; };
  }, [points]);

  const fetchRestaurants = () => {
    if (!mapRef.current || status === 'loading') return;

    abortRef.current?.abort();
    const abortCtrl = new AbortController();
    abortRef.current = abortCtrl;

    const lats  = points.map(p => p.lat);
    const lons  = points.map(p => p.lon);
    const south = Math.min(...lats) - 0.01;
    const north = Math.max(...lats) + 0.01;
    const west  = Math.min(...lons) - 0.01;
    const east  = Math.max(...lons) + 0.01;

    const query = `[out:json][timeout:30];(node["amenity"~"restaurant|cafe|fast_food|bakery"](${south},${west},${north},${east}););out body;`;

    const MIRRORS = [
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.private.coffee/api/interpreter',
      'https://overpass-api.de/api/interpreter',
    ];

    const tryFetch = async () => {
      for (const url of MIRRORS) {
        try {
          const r = await fetch(url, { method: 'POST', body: query, signal: abortCtrl.signal });
          if (r.ok) return await r.json();
        } catch (e: any) {
          if (e?.name === 'AbortError') throw e;
        }
      }
      throw new Error('all mirrors failed');
    };

    setStatus('loading');
    tryFetch()
      .then((data: { elements: Array<{ id: number; lat: number; lon: number; tags?: Record<string, string> }> }) => {
        if (!mapRef.current) return;
        const restaurants: Restaurant[] = data.elements
          .filter(el => isNearRoute(el.lat, el.lon, points))
          .map(el => ({
            id: el.id,
            lat: el.lat,
            lon: el.lon,
            name: el.tags?.name ?? 'Unnamed',
            type: el.tags?.amenity ?? 'restaurant',
          }));

        restaurants.forEach(r => {
          const color = AMENITY_COLOR[r.type] ?? GOLD;
          L.circleMarker([r.lat, r.lon], {
            radius: 7,
            fillColor: color,
            color: '#fff',
            weight: 2,
            fillOpacity: 1,
          })
            .bindPopup(
              `<div style="font-family:${RAL};padding:2px 0">` +
              `<div style="font-weight:800;font-size:13px;color:${TEXT};margin-bottom:2px">${r.name}</div>` +
              `<div style="font-size:11px;color:${MUTED};font-weight:600">${AMENITY_LABEL[r.type] ?? r.type}</div>` +
              `</div>`,
              { maxWidth: 180 }
            )
            .addTo(mapRef.current!);
        });

        setCount(restaurants.length);
        setStatus('done');
      })
      .catch((err) => { if (err?.name !== 'AbortError') setStatus('error'); });
  };

  if (points.length < 2) return null;

  return (
    <div>
      {/* Map */}
      <div style={{ position: 'relative' }}>
        <div ref={ref} style={{
          width: '100%', height: 320,
          border: '1.5px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }} />

        {/* Loading overlay */}
        {status === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(244,237,227,0.82)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            backdropFilter: 'blur(2px)',
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#E0D6C8" strokeWidth="3" />
              <path d="M18 4 A14 14 0 0 1 32 18" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div style={{ fontFamily: RAL, fontWeight: 700, fontSize: '0.8rem', color: TEXT, letterSpacing: '0.04em' }}>
              Searching for restaurants…
            </div>
            <div style={{ fontFamily: RAL, fontWeight: 500, fontSize: '0.7rem', color: MUTED }}>
              Querying OpenStreetMap
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Idle prompt overlay */}
        {status === 'idle' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(244,237,227,0.72)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            backdropFilter: 'blur(1px)',
          }}>
            <div style={{ fontSize: '1.75rem' }}>🍽️</div>
            <div style={{ fontFamily: RAL, fontWeight: 700, fontSize: '0.85rem', color: TEXT }}>
              Find restaurants along your route
            </div>
            <div style={{ fontFamily: RAL, fontWeight: 500, fontSize: '0.72rem', color: MUTED, textAlign: 'center', maxWidth: 240 }}>
              Cafés, restaurants, bakeries &amp; fast food within 500m
            </div>
            <button
              onClick={fetchRestaurants}
              style={{
                marginTop: '0.25rem',
                fontFamily: RAL,
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: GOLD,
                color: '#fff',
                border: 'none',
                borderRadius: 2,
                padding: '0.6rem 1.4rem',
                cursor: 'pointer',
              }}
            >
              Search Now
            </button>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ fontFamily: RAL, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 500 }}>
        {status === 'done'  && `${count} place${count !== 1 ? 's' : ''} found within 500m · click a marker for details`}
        {status === 'error' && '⚠ Could not load restaurant data — Overpass API unreachable'}
      </div>

      {status === 'done' && count > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries(AMENITY_LABEL).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: AMENITY_COLOR[key] ?? GOLD, flexShrink: 0 }} />
              <span style={{ fontFamily: RAL, fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
