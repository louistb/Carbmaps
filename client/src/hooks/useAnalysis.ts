import axios from 'axios';
import { useAnalysisStore } from '../store/analysisStore';
import { listLocalRides, saveLocalRide, getLocalRide, deleteLocalRide, updateLocalRide } from '../lib/localRides';

export function useAnalysis() {
  const { setAppState, setResult, setError, setSavedRides, updateResult, setIsReanalyzing } = useAnalysisStore();

  const refreshList = () => setSavedRides(listLocalRides());

  const analyze = async (formData: FormData) => {
    setAppState('loading');
    try {
      const response = await axios.post('/api/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      const { rideId, pacing, climbs, nutrition, weather, routePoints } = response.data;
      const analysisResult = { pacing, climbs, nutrition, weather, routePoints: routePoints ?? [] };

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

  const loadRide = (id: string) => {
    const ride = getLocalRide(id);
    if (!ride) { setError('Ride not found.'); return; }
    setResult(ride.analysisResult, ride.id);
  };

  const deleteRide = (id: string) => {
    deleteLocalRide(id);
    // Best-effort GPX cleanup on server (ignore errors)
    axios.delete(`/api/rides/${id}`).catch(() => {});
    refreshList();
  };

  const reanalyze = async (rideId: string, intensity: number) => {
    setIsReanalyzing(true);
    try {
      const ride = getLocalRide(rideId);
      const res = await axios.post(`/api/rides/${rideId}/reanalyze`, {
        intensity,
        ftpWatts: ride?.ftpWatts ?? 250,
        weightKg: ride?.weightKg ?? 70,
      });
      const { pacing, climbs, nutrition, weather, routePoints } = res.data;
      const analysisResult = { pacing, climbs, nutrition, weather, routePoints: routePoints ?? [] };
      updateLocalRide(rideId, analysisResult, intensity);
      updateResult(analysisResult);
      refreshList();
    } catch { /* silent */ } finally {
      setIsReanalyzing(false);
    }
  };

  return { analyze, fetchSavedRides, loadRide, deleteRide, reanalyze };
}
