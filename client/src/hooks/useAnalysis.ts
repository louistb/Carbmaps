import axios from 'axios';
import { useAnalysisStore } from '../store/analysisStore';
import { listLocalRides, saveLocalRide, getLocalRide, deleteLocalRide, updateLocalRide, saveLocalGpx, getLocalGpx } from '../lib/localRides';
import { getValidAccessToken } from '../lib/stravaAuth';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function useAnalysis() {
  const { setAppState, setResult, setError, setSavedRides, updateResult, setIsReanalyzing, result } = useAnalysisStore();

  const refreshList = () => setSavedRides(listLocalRides());

  const analyze = async (formData: FormData) => {
    setAppState('loading');
    try {
      const response = await axios.post(`${API_BASE}/api/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      const { rideId, pacing, climbs, nutrition, weather, routePoints } = response.data;
      const analysisResult = { pacing, climbs, nutrition, weather, routePoints: routePoints ?? [] };

      // Store GPX text so reanalysis can resend it without server-side storage
      const gpxFile = formData.get('gpxFile') as File;
      if (gpxFile) {
        const gpxText = await gpxFile.text();
        saveLocalGpx(rideId, gpxText);
      }

      const lastSegment = pacing.segments[pacing.segments.length - 1];
      saveLocalRide({
        id: rideId,
        name: (formData.get('gpxFile') as File)?.name?.replace(/\.(gpx|fit|tcx)$/i, '') ?? 'Route',
        createdAt: new Date().toISOString(),
        ftpWatts: parseFloat(formData.get('ftpWatts') as string),
        weightKg: parseFloat(formData.get('weightKg') as string),
        intensity: parseFloat(formData.get('intensity') as string),
        estimatedTotalTimeMin: pacing.estimatedTotalTimeMin,
        totalDistanceKm: parseFloat((lastSegment?.endKm ?? 0).toFixed(1)),
        climbCount: climbs.climbs.length,
        analysisResult,
      });

      setResult(analysisResult, rideId);
      refreshList();
    } catch (err: unknown) {
      let message = 'Analysis failed. Please try again.';
      if (axios.isAxiosError(err)) {
        message = err.response?.data?.error ?? err.message ?? message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
    }
  };

  const fetchSavedRides = () => refreshList();

  const refreshWeather = async (rideId: string, startDateTime?: string) => {
    const ride    = getLocalRide(rideId);
    const gpxText = getLocalGpx(rideId);
    if (!ride || !gpxText) return;

    try {
      const fd = new FormData();
      fd.append('gpxFile', new Blob([gpxText], { type: 'application/gpx+xml' }), `${rideId}.gpx`);
      fd.append('ftpWatts',     String(ride.ftpWatts));
      fd.append('weightKg',     String(ride.weightKg));
      fd.append('intensity',    String(ride.intensity));
      fd.append('startDateTime', startDateTime ?? new Date().toISOString());

      const res = await axios.post(`${API_BASE}/api/rides/${rideId}/weather`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000,
      });

      if (res.data.weather) {
        const current = useAnalysisStore.getState().result;
        if (current) {
          const updated = { ...current, weather: res.data.weather };
          updateResult(updated);
          updateLocalRide(rideId, updated, ride.intensity);
        }
      }
    } catch { /* silent — stale weather stays */ }
  };

  const loadRide = (id: string) => {
    const ride = getLocalRide(id);
    if (!ride) { setError('Ride not found.'); return; }
    setResult(ride.analysisResult, ride.id);
    refreshWeather(id); // background — updates weather once fetched
  };

  const deleteRide = (id: string) => {
    deleteLocalRide(id);
    refreshList();
  };

  const reanalyze = async (rideId: string, intensity: number): Promise<{ rateLimitResetAt?: number }> => {
    setIsReanalyzing(true);
    try {
      const ride = getLocalRide(rideId);
      if (!ride) { setIsReanalyzing(false); return; }

      let res;
      const gpxText = getLocalGpx(rideId);

      if (!gpxText && ride.stravaRouteId) {
        // Strava route — re-fetch GPS from Strava API (no local cache per ToS)
        const token = await getValidAccessToken();
        if (!token) { setIsReanalyzing(false); return; }
        res = await axios.post(`${API_BASE}/api/strava/analyze-route/${ride.stravaRouteId}`, {
          access_token: token,
          ftpWatts: ride.ftpWatts,
          weightKg: ride.weightKg,
          intensity,
        });
      } else {
        if (!gpxText) { setIsReanalyzing(false); return; }
        const fd = new FormData();
        fd.append('gpxFile', new Blob([gpxText], { type: 'application/gpx+xml' }), `${rideId}.gpx`);
        fd.append('ftpWatts', String(ride.ftpWatts));
        fd.append('weightKg', String(ride.weightKg));
        fd.append('intensity', String(intensity));
        res = await axios.post(`${API_BASE}/api/rides/${rideId}/reanalyze`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const { pacing, climbs, nutrition, weather, routePoints } = res.data;
      const analysisResult = { pacing, climbs, nutrition, weather: weather ?? result?.weather ?? null, routePoints: routePoints ?? [] };
      updateLocalRide(rideId, analysisResult, intensity);
      updateResult(analysisResult);
      refreshList();
      return {};
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 429) {
        const resetHeader = e.response.headers['ratelimit-reset'];
        const resetAt = resetHeader ? Number(resetHeader) : Math.floor(Date.now() / 1000) + 15 * 60;
        return { rateLimitResetAt: resetAt };
      }
    } finally {
      setIsReanalyzing(false);
    }
    return {};
  };

  return { analyze, fetchSavedRides, loadRide, deleteRide, reanalyze, refreshWeather };
}
