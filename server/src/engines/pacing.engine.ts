import { ParsedRoute } from '../types/route.types';
import { RiderSettings } from '../types/rider.types';
import { PacingResult, SegmentPacing } from '../types/analysis.types';
import { clamp, durationAdjustmentFactor, fourthPowerMean, rollingAverage } from '../utils/math';

const SEGMENT_LENGTH_KM = 1.0;

/** Map a continuous FTP % target (60–95) to a zone band and label. */
function intensityToZone(ftpPct: number): { low: number; high: number; label: string } {
  const band = 3.5;
  const low  = Math.max(55, ftpPct - band) / 100;
  const high = Math.min(100, ftpPct + band) / 100;

  let name: string;
  if      (ftpPct <= 63) name = 'Casual';
  else if (ftpPct <= 72) name = 'Endurance';
  else if (ftpPct <= 83) name = 'Tempo';
  else                   name = 'Race';

  return { low, high, label: `${name} · ${Math.round(ftpPct)}% FTP` };
}

function gradientFactor(gradientPct: number): number {
  if (gradientPct >= 8)  return 1.35;
  if (gradientPct >= 4)  return 1.0 + (gradientPct - 4) / 4 * 0.35;
  if (gradientPct >= 0)  return 1.0;
  if (gradientPct >= -4) return 1.0 + (gradientPct / 4) * 0.30;
  return 0.70;
}

function estimateSpeedKmh(powerW: number, gradientPct: number, totalMassKg = 80): number {
  // Physics model: P = (Fgravity + Frr + Faero) * v
  // Faero = 0.5 * CdA * rho * v²  (CdA=0.3, rho=1.2 kg/m³)
  // Fgravity = mass * 9.81 * grade/100
  // Frr = Crr * mass * 9.81  (Crr=0.005)
  const g = 9.81;
  const aeroCoeff = 0.5 * 0.3 * 1.2; // 0.18
  const Fgravity = totalMassKg * g * (gradientPct / 100);
  const Frr = 0.005 * totalMassKg * g;
  const Fconst = Fgravity + Frr;

  // Solve cubic: aeroCoeff*v³ + Fconst*v - powerW = 0  (Newton's method)
  // On descents Fconst is negative; seed from aero-equilibrium speed to avoid divergence
  let v = Fconst < 0
    ? Math.sqrt(-Fconst / aeroCoeff) + 1   // near terminal velocity
    : Math.max(0.5, powerW / (Fconst + 50)); // uphill/flat guess
  for (let i = 0; i < 25; i++) {
    const f  = aeroCoeff * v * v * v + Fconst * v - powerW;
    const df = 3 * aeroCoeff * v * v + Fconst;
    const dv = f / df;
    v -= dv;
    if (v < 0.1) { v = 0.1; break; }
    if (Math.abs(dv) < 1e-6) break;
  }
  return Math.max(1, v * 3.6); // m/s → km/h
}

export function runPacingEngine(route: ParsedRoute, rider: RiderSettings): PacingResult {
  const { ftpWatts, intensity } = rider;
  const zone = intensityToZone(intensity);

  const midPct = (zone.low + zone.high) / 2;
  const roughBasePower = midPct * ftpWatts;
  const totalMassKg = rider.weightKg + 8; // rider + bike
  const roughSpeed = estimateSpeedKmh(roughBasePower, 0, totalMassKg);
  const roughDurationHours = Math.max(0.25, route.totalDistanceKm / roughSpeed);

  const durAdj = durationAdjustmentFactor(roughDurationHours);
  const baselinePct = clamp(durAdj, zone.low, zone.high);

  const segments: SegmentPacing[] = [];
  let cumulativeTimeSec = 0;
  const powerTrace: number[] = [];

  const totalPoints = route.points;
  let segStart = 0;

  while (segStart < totalPoints.length - 1) {
    let segEnd = segStart + 1;
    const startDist = totalPoints[segStart].distanceFromStartKm;
    while (
      segEnd < totalPoints.length - 1 &&
      totalPoints[segEnd].distanceFromStartKm - startDist < SEGMENT_LENGTH_KM
    ) {
      segEnd++;
    }

    const endDist = totalPoints[segEnd].distanceFromStartKm;
    const segLengthKm = endDist - startDist;
    if (segLengthKm <= 0) { segStart = segEnd; continue; }

    const elevStart = totalPoints[segStart].elevationM;
    const elevEnd   = totalPoints[segEnd].elevationM;
    const gradientPct = ((elevEnd - elevStart) / (segLengthKm * 1000)) * 100;

    const gFactor = gradientFactor(gradientPct);
    const targetPowerW = clamp(baselinePct * ftpWatts * gFactor, ftpWatts * zone.low * 0.7, ftpWatts * 1.10);
    const targetPowerPct = (targetPowerW / ftpWatts) * 100;

    // Use base power (not gradient-boosted) for speed — physics model already accounts for gravity
    const speedPowerW = baselinePct * ftpWatts;
    const speedKmh = estimateSpeedKmh(speedPowerW, gradientPct, totalMassKg);
    const segTimeSec = (segLengthKm / speedKmh) * 3600;
    const segTimeMin = segTimeSec / 60;

    const flag: SegmentPacing['flag'] =
      (gradientPct > 6 && targetPowerPct > 105) ? 'hold-back' : null;

    const thirtySecIntervals = Math.max(1, Math.round(segTimeSec / 30));
    for (let i = 0; i < thirtySecIntervals; i++) {
      powerTrace.push(targetPowerW);
    }

    segments.push({
      segmentIndex: segments.length,
      startKm: startDist,
      endKm: endDist,
      elevationM: Math.round(elevStart),
      gradient: Math.round(gradientPct * 10) / 10,
      targetPowerW: Math.round(targetPowerW),
      targetPowerPct: Math.round(targetPowerPct * 10) / 10,
      estimatedTimeMin: Math.round(segTimeMin * 10) / 10,
      flag,
    });

    cumulativeTimeSec += segTimeSec;
    segStart = segEnd;
  }

  const estimatedTotalTimeMin = cumulativeTimeSec / 60;
  const smoothed = rollingAverage(powerTrace, 1);
  const normalizedPowerW = Math.round(fourthPowerMean(smoothed));
  const intensityFactor = Math.round((normalizedPowerW / ftpWatts) * 1000) / 1000;
  const tss = Math.round((cumulativeTimeSec * normalizedPowerW * intensityFactor) / (ftpWatts * 3600) * 100);

  return {
    segments,
    normalizedPowerW,
    intensityFactor,
    tss,
    estimatedTotalTimeMin: Math.round(estimatedTotalTimeMin),
    targetZoneLabel: zone.label,
    targetZonePctLow: Math.round(zone.low * 100),
    targetZonePctHigh: Math.round(zone.high * 100),
  };
}
