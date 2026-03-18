import type { AnalysisResult } from '../types/analysis';

const KEY     = 'carbmaps_rides';
const GPX_KEY = (id: string) => `carbmaps_gpx_${id}`;

export function saveLocalGpx(id: string, gpxText: string): void {
  localStorage.setItem(GPX_KEY(id), gpxText);
}

export function getLocalGpx(id: string): string | null {
  return localStorage.getItem(GPX_KEY(id));
}

export function deleteLocalGpx(id: string): void {
  localStorage.removeItem(GPX_KEY(id));
}

export interface LocalRide {
  id: string;
  name: string;
  createdAt: string;
  ftpWatts: number;
  weightKg: number;
  intensity: number;
  estimatedTotalTimeMin: number;
  totalDistanceKm: number;
  climbCount: number;
  analysisResult: AnalysisResult;
}

export function listLocalRides(): LocalRide[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

export function saveLocalRide(ride: LocalRide): void {
  const rides = listLocalRides().filter(r => r.id !== ride.id);
  rides.unshift(ride);
  localStorage.setItem(KEY, JSON.stringify(rides));
}

export function getLocalRide(id: string): LocalRide | null {
  return listLocalRides().find(r => r.id === id) ?? null;
}

export function deleteLocalRide(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(listLocalRides().filter(r => r.id !== id)));
  deleteLocalGpx(id);
}

export function updateLocalRide(id: string, analysisResult: AnalysisResult, intensity: number): void {
  const rides = listLocalRides();
  const idx = rides.findIndex(r => r.id === id);
  if (idx === -1) return;
  rides[idx] = { ...rides[idx], analysisResult, intensity };
  localStorage.setItem(KEY, JSON.stringify(rides));
}
