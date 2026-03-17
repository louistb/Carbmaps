import React, { useEffect, useRef } from 'react';
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
    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [24, 24] });
    }, 250);

    return () => { map.remove(); mapRef.current = null; };
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
    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [24, 24] });
    }, 250);

    return () => { map.remove(); mapRef.current = null; };
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
