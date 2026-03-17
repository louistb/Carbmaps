/**
 * Haversine formula — returns distance in km between two lat/lon points
 */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Interpolate a lat/lon point at a given fraction (0–1) between two points
 */
export function interpolate(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  t: number
): { lat: number; lon: number } {
  return {
    lat: lat1 + (lat2 - lat1) * t,
    lon: lon1 + (lon2 - lon1) * t,
  };
}

/**
 * Find the point at a given cumulative distance along the route
 */
export function pointAtDistance(
  points: Array<{ lat: number; lon: number; distanceFromStartKm: number }>,
  targetKm: number
): { lat: number; lon: number } | null {
  if (points.length === 0) return null;
  if (targetKm <= 0) return { lat: points[0].lat, lon: points[0].lon };
  const last = points[points.length - 1];
  if (targetKm >= last.distanceFromStartKm) return { lat: last.lat, lon: last.lon };

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (curr.distanceFromStartKm >= targetKm) {
      const span = curr.distanceFromStartKm - prev.distanceFromStartKm;
      const t = span === 0 ? 0 : (targetKm - prev.distanceFromStartKm) / span;
      return interpolate(prev.lat, prev.lon, curr.lat, curr.lon, t);
    }
  }
  return null;
}
