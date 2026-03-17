import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPoint, SegmentPacing, ClimbData } from '../types/analysis';

// ── Colour helpers ────────────────────────────────────────────────────────────

// Greyscale: light = easy, dark = hard
function effortColor(pct: number): string {
  if (pct < 55) return '#d8d8d8';
  if (pct < 65) return '#b0b0b0';
  if (pct < 75) return '#808080';
  if (pct < 85) return '#484848';
  if (pct < 95) return '#242424';
  return '#000000';
}

// Greyscale elevation shading
function elevColor(t: number): string {
  if (t < 0.25) return '#d0d0d0';
  if (t < 0.55) return '#909090';
  if (t < 0.80) return '#505050';
  return '#202020';
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

// ── PacingMap ─────────────────────────────────────────────────────────────────

interface PacingMapProps {
  points: MapPoint[];
  segments: SegmentPacing[];
  hoveredKm: number | null;
}

export function PacingMap({ points, segments, hoveredKm }: PacingMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!ref.current || points.length < 2) return;

    const map = L.map(ref.current, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB',
      maxZoom: 19,
    }).addTo(map);

    // Draw one polyline per segment, coloured by effort
    for (const seg of segments) {
      const pts = pointsBetween(points, seg.startKm, seg.endKm);
      if (pts.length < 2) continue;
      L.polyline(pts.map(p => [p.lat, p.lon] as L.LatLngTuple), {
        color: effortColor(seg.targetPowerPct),
        weight: 5,
        opacity: 0.9,
      }).addTo(map);
    }

    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon] as L.LatLngTuple));
    // Fit after invalidateSize so zoom is calculated on the real container size
    const tid = setTimeout(() => {
      if (!mapRef.current) return;
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [24, 24] });
    }, 250);

    return () => { clearTimeout(tid); map.remove(); mapRef.current = null; };
  }, [points, segments]);

  // Update hover marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.remove();
    markerRef.current = null;
    if (hoveredKm === null) return;
    const pt = closestPoint(points, hoveredKm);
    markerRef.current = L.circleMarker([pt.lat, pt.lon], {
      radius: 7,
      fillColor: '#000000',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map);
  }, [hoveredKm, points]);

  if (points.length < 2) return null;
  return <div ref={ref} style={{ width: '100%', height: 260 }} />;
}

// ── ClimbsMap ──────────────────────────────────────────────────────────────────

interface ClimbsMapProps {
  points: MapPoint[];
  climbs: ClimbData[];
  hoveredClimbIdx: number | null;
}

export function ClimbsMap({ points, climbs, hoveredClimbIdx }: ClimbsMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const highlightRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!ref.current || points.length < 2) return;

    const map = L.map(ref.current, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB',
      maxZoom: 19,
    }).addTo(map);

    // Base route coloured by elevation
    const elevs = points.map(p => p.elevationM);
    const minE = Math.min(...elevs);
    const maxE = Math.max(...elevs);
    const range = maxE - minE || 1;
    const CHUNK = 10;
    for (let i = 0; i < points.length - 1; i += CHUNK) {
      const chunk = points.slice(i, Math.min(i + CHUNK + 1, points.length));
      if (chunk.length < 2) continue;
      const avgE = chunk.reduce((s, p) => s + p.elevationM, 0) / chunk.length;
      L.polyline(chunk.map(p => [p.lat, p.lon] as L.LatLngTuple), {
        color: elevColor((avgE - minE) / range),
        weight: 4,
        opacity: 0.8,
      }).addTo(map);
    }

    // Mark climb start dots
    for (const climb of climbs) {
      const pt = closestPoint(points, climb.startKm);
      L.circleMarker([pt.lat, pt.lon], {
        radius: 5,
        fillColor: '#000000',
        color: '#fff',
        weight: 1.5,
        fillOpacity: 1,
      }).bindTooltip(climb.name, { permanent: false, direction: 'top' }).addTo(map);
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
        color: '#000000',
        weight: 6,
        opacity: 1,
      }).addTo(map);
    }

    const pt = closestPoint(points, climb.startKm);
    markerRef.current = L.circleMarker([pt.lat, pt.lon], {
      radius: 9,
      fillColor: '#000000',
      color: '#ffffff',
      weight: 2.5,
      fillOpacity: 1,
    }).addTo(map);
  }, [hoveredClimbIdx, points, climbs]);

  if (points.length < 2) return null;
  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 260 }} />;
}

// ── NutritionMap ───────────────────────────────────────────────────────────────

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
  // Sample every 5th point for performance
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

interface NutritionMapProps {
  points: MapPoint[];
}

export function NutritionMap({ points }: NutritionMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!ref.current || points.length < 2) return;

    const map = L.map(ref.current, { scrollWheelZoom: false, zoomControl: true });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CartoDB',
      maxZoom: 19,
    }).addTo(map);

    // Draw route
    L.polyline(points.map(p => [p.lat, p.lon] as L.LatLngTuple), {
      color: '#000',
      weight: 3,
      opacity: 0.6,
    }).addTo(map);

    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon] as L.LatLngTuple));
    const tid = setTimeout(() => {
      if (!mapRef.current) return;
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [24, 24] });
    }, 250);

    // Fetch restaurants via Overpass API
    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);
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

    const abortCtrl = new AbortController();

    const tryFetch = async () => {
      for (const url of MIRRORS) {
        try {
          const r = await fetch(url, { method: 'POST', body: query, signal: abortCtrl.signal });
          if (r.ok) return await r.json();
        } catch (e: any) {
          if (e?.name === 'AbortError') throw e;
          // try next mirror
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
          L.circleMarker([r.lat, r.lon], {
            radius: 7,
            fillColor: '#000',
            color: '#fff',
            weight: 2,
            fillOpacity: 1,
          })
            .bindPopup(`<b style="font-family:Georgia,serif">${r.name}</b><br><span style="font-size:0.8em;color:#666">${AMENITY_LABEL[r.type] ?? r.type}</span>`)
            .addTo(mapRef.current!);
        });

        setCount(restaurants.length);
        setStatus('done');
      })
      .catch((err) => { if (err?.name !== 'AbortError') setStatus('error'); });

    return () => { clearTimeout(tid); abortCtrl.abort(); map.remove(); mapRef.current = null; };
  }, [points]);

  if (points.length < 2) return null;

  const sans = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";

  return (
    <div>
      <div ref={ref} style={{ width: '100%', height: 320, border: '2px solid #000' }} />
      <div style={{ fontFamily: sans, fontSize: '0.72rem', color: '#999', marginTop: '0.4rem' }}>
        {status === 'loading' && 'Loading restaurants near route…'}
        {status === 'done'    && `${count} place${count !== 1 ? 's' : ''} found within 500 m of route · click a dot for details`}
        {status === 'error'   && 'Could not load restaurant data (Overpass API unreachable)'}
        {status === 'idle'    && ''}
      </div>
    </div>
  );
}
