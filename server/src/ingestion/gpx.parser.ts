import GpxParser from 'gpxparser';
import { ParsedRoute, RoutePoint } from '../types/route.types';
import { haversineKm } from '../utils/geo';

interface RawPoint {
  lat: number;
  lon: number;
  ele: number;
  time?: string;
}

/**
 * Regex-based extraction — works reliably in Node.js
 * regardless of DOMParser/xmldom behaviour
 */
function extractPointsViaRegex(gpxContent: string): RawPoint[] {
  const points: RawPoint[] = [];
  const trkptRegex = /<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>/g;
  let match: RegExpExecArray | null;

  while ((match = trkptRegex.exec(gpxContent)) !== null) {
    const attrs = match[1];
    const body  = match[2];

    const latM = /lat="([^"]+)"/.exec(attrs);
    const lonM = /lon="([^"]+)"/.exec(attrs);
    if (!latM || !lonM) continue;

    const lat = parseFloat(latM[1]);
    const lon = parseFloat(lonM[1]);
    if (isNaN(lat) || isNaN(lon)) continue;

    const eleM = /<ele>([\s\S]*?)<\/ele>/.exec(body);
    const ele  = eleM ? parseFloat(eleM[1].trim()) : 0;

    const timeM = /<time>([\s\S]*?)<\/time>/.exec(body);

    points.push({
      lat,
      lon,
      ele: isNaN(ele) ? 0 : ele,
      time: timeM ? timeM[1].trim() : undefined,
    });
  }
  return points;
}

function extractName(gpxContent: string): string | undefined {
  const m = /<name>([\s\S]*?)<\/name>/.exec(gpxContent);
  return m ? m[1].trim().replace(/<[^>]+>/g, '') : undefined;
}

export function parseGpx(gpxContent: string): ParsedRoute {
  // --- Primary: regex (reliable Node.js) ---
  let rawPoints = extractPointsViaRegex(gpxContent);

  // --- Fallback: gpxparser (catches non-standard layouts) ---
  if (rawPoints.length < 2) {
    try {
      const gpx = new GpxParser();
      gpx.parse(gpxContent);
      if (gpx.tracks?.length && gpx.tracks[0].points?.length >= 2) {
        rawPoints = gpx.tracks[0].points.map((p: any) => ({
          lat: p.lat,
          lon: p.lon,
          ele: typeof p.ele === 'number' ? p.ele : parseFloat(String(p.ele)) || 0,
          time: p.time ? String(p.time) : undefined,
        }));
      }
    } catch { /* ignore */ }
  }

  // If regex found points but gpxparser has elevation when regex didn't, merge elevation
  const hasEle = rawPoints.some(p => p.ele !== 0);
  if (!hasEle) {
    try {
      const gpx = new GpxParser();
      gpx.parse(gpxContent);
      const gpts = gpx.tracks?.[0]?.points ?? [];
      if (gpts.some((p: any) => p.ele)) {
        for (let i = 0; i < Math.min(rawPoints.length, gpts.length); i++) {
          const e = typeof gpts[i].ele === 'number' ? gpts[i].ele : parseFloat(String(gpts[i].ele)) || 0;
          rawPoints[i].ele = e;
        }
      }
    } catch { /* ignore */ }
  }

  if (rawPoints.length < 2) {
    throw new Error('Could not extract a GPS track from this GPX file. Ensure it contains a <trk> with <trkpt> elements.');
  }

  const points: RoutePoint[] = [];
  let cumulativeKm = 0;
  let totalElevationGainM = 0;
  let totalElevationLossM = 0;

  for (let i = 0; i < rawPoints.length; i++) {
    const p = rawPoints[i];
    if (i > 0) {
      const prev = rawPoints[i - 1];
      cumulativeKm += haversineKm(prev.lat, prev.lon, p.lat, p.lon);
      const diff = p.ele - prev.ele;
      if (diff > 0) totalElevationGainM += diff;
      else totalElevationLossM += Math.abs(diff);
    }

    let timeOffsetSec: number | undefined;
    if (p.time && rawPoints[0].time) {
      try {
        timeOffsetSec = (new Date(p.time).getTime() - new Date(rawPoints[0].time!).getTime()) / 1000;
      } catch { /* ignore */ }
    }

    points.push({
      lat: p.lat,
      lon: p.lon,
      elevationM: p.ele,
      distanceFromStartKm: cumulativeKm,
      timeOffsetSec,
    });
  }

  return {
    points,
    totalDistanceKm: cumulativeKm,
    totalElevationGainM,
    totalElevationLossM,
    format: 'gpx',
    name: extractName(gpxContent) || 'Route',
  };
}
