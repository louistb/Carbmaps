export interface RoutePoint {
  lat: number;
  lon: number;
  elevationM: number;
  distanceFromStartKm: number;
  timeOffsetSec?: number;
}

export interface ParsedRoute {
  points: RoutePoint[];
  totalDistanceKm: number;
  totalElevationGainM: number;
  totalElevationLossM: number;
  format: 'gpx' | 'fit' | 'tcx';
  name?: string;
}
