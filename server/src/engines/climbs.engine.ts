import { ParsedRoute } from '../types/route.types';
import { RiderSettings } from '../types/rider.types';
import { PacingResult, ClimbsResult, ClimbData } from '../types/analysis.types';
import { clamp } from '../utils/math';

const MIN_GRADIENT_PCT = 4.0;
const MIN_LENGTH_KM = 0.5;
const MAX_GAP_KM = 4.0; // merge climbs with a flat gap smaller than this

export function runClimbsEngine(
  route: ParsedRoute,
  rider: RiderSettings,
  pacing: PacingResult
): ClimbsResult {
  const { ftpWatts, intensity } = rider;
  // intensity is a continuous FTP % (60–95); derive climb suggestion power as ±3.5% band midpoint × 1.075
  const band = 3.5;
  const midZonePct = clamp(intensity, 55, 100) / 100;
  const climbPowerFactor = clamp((midZonePct + band / 100) * 1.075, 0, 1.05);

  const segments = pacing.segments;

  // 1. Collect raw climb segment-index ranges
  type Range = { start: number; end: number };
  const rawRanges: Range[] = [];
  let i = 0;
  while (i < segments.length) {
    if (segments[i].gradient >= MIN_GRADIENT_PCT) {
      const start = i;
      while (i < segments.length && segments[i].gradient >= MIN_GRADIENT_PCT) i++;
      rawRanges.push({ start, end: i - 1 });
    } else {
      i++;
    }
  }

  // 2. Merge ranges whose gap (in km) is <= MAX_GAP_KM
  const mergedRanges: Range[] = [];
  for (const range of rawRanges) {
    if (mergedRanges.length === 0) {
      mergedRanges.push({ ...range });
    } else {
      const prev = mergedRanges[mergedRanges.length - 1];
      const gapKm = segments[range.start].startKm - segments[prev.end].endKm;
      if (gapKm <= MAX_GAP_KM) {
        prev.end = range.end; // extend previous range
      } else {
        mergedRanges.push({ ...range });
      }
    }
  }

  // 3. Build ClimbData from merged ranges
  const climbs: ClimbData[] = [];

  for (const { start: climbStart, end: climbEnd } of mergedRanges) {
      const startKm = segments[climbStart].startKm;
      const endKm = segments[climbEnd].endKm;
      const lengthKm = endKm - startKm;

      if (lengthKm < MIN_LENGTH_KM) continue;

      // Find elevation gain by looking at route points in this range
      const routePointsInClimb = route.points.filter(
        p => p.distanceFromStartKm >= startKm && p.distanceFromStartKm <= endKm
      );

      let elevationGainM = 0;
      for (let j = 1; j < routePointsInClimb.length; j++) {
        const diff = routePointsInClimb[j].elevationM - routePointsInClimb[j - 1].elevationM;
        if (diff > 0) elevationGainM += diff;
      }

      const avgGradientPct =
        segments.slice(climbStart, climbEnd + 1).reduce((s, seg) => s + seg.gradient, 0) /
        (climbEnd - climbStart + 1);

      const maxGradientPct = Math.max(...segments.slice(climbStart, climbEnd + 1).map(s => s.gradient));

      const estimatedDurationMin = segments
        .slice(climbStart, climbEnd + 1)
        .reduce((s, seg) => s + seg.estimatedTimeMin, 0);

      // Suggested power: zone midpoint × 1.075, capped at 105% FTP
      const suggestedPowerW = clamp(climbPowerFactor * ftpWatts, 0, ftpWatts * 1.05);
      const suggestedPowerPct = (suggestedPowerW / ftpWatts) * 100;

      climbs.push({
        climbNumber: climbs.length + 1,
        name: `Climb ${climbs.length + 1}`,
        startKm: Math.round(startKm * 10) / 10,
        lengthKm: Math.round(lengthKm * 10) / 10,
        elevationGainM: Math.round(elevationGainM),
        avgGradientPct: Math.round(avgGradientPct * 10) / 10,
        maxGradientPct: Math.round(maxGradientPct * 10) / 10,
        estimatedDurationMin: Math.round(estimatedDurationMin * 10) / 10,
        suggestedPowerW: Math.round(suggestedPowerW),
        suggestedPowerPct: Math.round(suggestedPowerPct * 10) / 10,
      });
  }

  return { climbs };
}
