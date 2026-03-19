import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAnalysisStore } from '../store/analysisStore';
import {
  saveStravaTokens, clearStravaTokens,
  getValidAccessToken, isStravaConnected, getStravaTokens,
} from '../lib/stravaAuth';
import { saveLocalRide, saveLocalGpx } from '../lib/localRides';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface StravaRoute {
  id:                    string;
  name:                  string;
  distance:              number;  // metres
  elevation_gain:        number;  // metres
  estimated_moving_time: number;  // seconds
  created_at:            string;
  updated_at:            string;
}

export function useStrava() {
  const [routes, setRoutes]               = useState<StravaRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [connected, setConnected]         = useState(isStravaConnected);
  const { setAppState, setResult, setError } = useAnalysisStore();

  const connect = useCallback(async () => {
    const res = await fetch(
      `${API_BASE}/api/strava/auth?redirect_uri=${encodeURIComponent(window.location.origin)}`,
    );
    const { url } = await res.json();
    window.location.href = url;
  }, []);

  const handleCallback = useCallback(async (code: string) => {
    const res = await fetch(`${API_BASE}/api/strava/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: window.location.origin }),
    });
    if (!res.ok) throw new Error('Token exchange failed');
    const tokens = await res.json();
    saveStravaTokens(tokens);
    setConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    clearStravaTokens();
    setConnected(false);
    setRoutes([]);
  }, []);

  const fetchRoutes = useCallback(async () => {
    const token     = await getValidAccessToken();
    const athleteId = getStravaTokens()?.athleteId;
    if (!token || !athleteId) { setConnected(false); return; }
    setLoadingRoutes(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/strava/routes`, {
        params: { access_token: token, athlete_id: athleteId },
      });
      setRoutes(data);
    } catch {
      setRoutes([]);
    } finally {
      setLoadingRoutes(false);
    }
  }, []);

  const analyzeRoute = useCallback(async (
    routeId:       string,
    routeName:     string,
    ftpWatts:      number,
    weightKg:      number,
    intensity:     number,
    startDateTime?: string,
  ) => {
    const token = await getValidAccessToken();
    if (!token) { setError('Strava session expired — please reconnect.'); return; }

    setAppState('loading');
    try {
      const { data } = await axios.post(`${API_BASE}/api/strava/analyze-route/${routeId}`, {
        access_token: token, ftpWatts, weightKg, intensity,
        ...(startDateTime ? { startDateTime } : {}),
      });

      const { rideId, pacing, climbs, nutrition, weather, routePoints, gpxData } = data;
      const analysisResult = { pacing, climbs, nutrition, weather, routePoints: routePoints ?? [] };

      // Cache as GPX so future reanalysis uses local storage instead of Strava API
      if (gpxData) saveLocalGpx(rideId, gpxData);

      const lastSeg = pacing.segments[pacing.segments.length - 1];
      saveLocalRide({
        id: rideId, name: routeName,
        createdAt: new Date().toISOString(),
        ftpWatts, weightKg, intensity,
        estimatedTotalTimeMin: pacing.estimatedTotalTimeMin,
        totalDistanceKm: parseFloat((lastSeg?.endKm ?? 0).toFixed(1)),
        climbCount: climbs.climbs.length,
        analysisResult,
        stravaRouteId: String(routeId),
      });

      setResult(analysisResult, rideId);
    } catch (err: unknown) {
      let message = 'Strava analysis failed.';
      if (axios.isAxiosError(err)) message = err.response?.data?.error ?? err.message ?? message;
      setError(message);
    }
  }, [setAppState, setResult, setError]);

  return {
    connected,
    routes,
    loadingRoutes,
    athleteName: getStravaTokens()?.athleteName ?? '',
    connect,
    handleCallback,
    disconnect,
    fetchRoutes,
    analyzeRoute,
  };
}
