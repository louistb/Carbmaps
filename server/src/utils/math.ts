/**
 * Rolling average over a window of size `window`
 */
export function rollingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between a and b at fraction t
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Power-law duration-adjusted FTP fraction
 * P(t) = 0.985 * FTP * t^(-0.195) where t is hours
 * Returns a multiplier (not watts)
 */
export function durationAdjustmentFactor(durationHours: number): number {
  if (durationHours <= 0) return 1;
  return 0.985 * Math.pow(durationHours, -0.195);
}

/**
 * 4th-power mean (for Normalized Power calculation)
 */
export function fourthPowerMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + Math.pow(v, 4), 0);
  return Math.pow(sum / values.length, 0.25);
}

/**
 * Smooth an elevation array with a simple box average of ±halfWidth points.
 * Reduces GPS noise without blurring real gradient features.
 */
export function smoothElevation(elevations: number[], halfWidth = 3): number[] {
  const n = elevations.length;
  if (n === 0) return [];
  return elevations.map((_, i) => {
    const lo = Math.max(0, i - halfWidth);
    const hi = Math.min(n - 1, i + halfWidth);
    let sum = 0;
    for (let j = lo; j <= hi; j++) sum += elevations[j];
    return sum / (hi - lo + 1);
  });
}
