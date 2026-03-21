import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import rateLimit from 'express-rate-limit';

const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
});
import { runPacingEngine } from '../engines/pacing.engine';
import { runClimbsEngine } from '../engines/climbs.engine';
import { runNutritionEngine } from '../engines/nutrition.engine';
import { runWeatherEngine } from '../engines/weather.engine';
import { RiderSettings } from '../types/rider.types';
import { RoutePoint, ParsedRoute } from '../types/route.types';
import { MapPoint } from '../types/analysis.types';

const router = Router();


const CLIENT_ID     = process.env.STRAVA_CLIENT_ID!;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;


// Strava uses 64-bit integer IDs that exceed JS Number precision.
// Parse the raw response text and quote any numeric "id" values before JSON.parse.
const safeJson = [(raw: string) => JSON.parse(raw.replace(/"id"\s*:\s*(\d{10,})/g, '"id":"$1"'))];
const STRAVA_TOKEN  = 'https://www.strava.com/oauth/token';
const STRAVA_API    = 'https://www.strava.com/api/v3';

function samplePoints(points: RoutePoint[], maxN: number): MapPoint[] {
  const src = points.length <= maxN ? points : Array.from(
    { length: maxN },
    (_, i) => points[Math.round(i * (points.length - 1) / (maxN - 1))],
  );
  return src.map(p => ({ lat: p.lat, lon: p.lon, distanceKm: p.distanceFromStartKm, elevationM: p.elevationM }));
}

// GET /api/strava/auth?redirect_uri=...  → returns the Strava OAuth URL
router.get('/auth', (req: Request, res: Response) => {
  const redirectUri = req.query.redirect_uri as string;
  if (!redirectUri) { res.status(400).json({ error: 'redirect_uri required' }); return; }

  const url = new URL('https://www.strava.com/oauth/authorize');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'read,activity:read');
  url.searchParams.set('state', 'carbmaps');
  res.json({ url: url.toString() });
});

// POST /api/strava/token  { code, redirect_uri }  → exchange for tokens
router.post('/token', async (req: Request, res: Response) => {
  const { code, redirect_uri } = req.body;
  if (!code) { res.status(400).json({ error: 'code required' }); return; }
  try {
    const { data } = await axios.post(STRAVA_TOKEN, {
      client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      code, grant_type: 'authorization_code', redirect_uri,
    });
    res.json({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
      athlete: { id: data.athlete?.id, firstname: data.athlete?.firstname },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.response?.data?.message ?? 'Token exchange failed' });
  }
});

// POST /api/strava/refresh  { refresh_token }  → new access token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) { res.status(400).json({ error: 'refresh_token required' }); return; }
  try {
    const { data } = await axios.post(STRAVA_TOKEN, {
      client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
      refresh_token, grant_type: 'refresh_token',
    });
    res.json({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.response?.data?.message ?? 'Token refresh failed' });
  }
});

// GET /api/strava/routes?access_token=...&athlete_id=...  → saved routes
router.get('/routes', async (req: Request, res: Response) => {
  const { access_token, athlete_id } = req.query as Record<string, string>;
  if (!access_token) { res.status(401).json({ error: 'access_token required' }); return; }
  if (!athlete_id)   { res.status(400).json({ error: 'athlete_id required' });   return; }
  try {
    const { data } = await axios.get(`${STRAVA_API}/athletes/${athlete_id}/routes`, {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { per_page: 30 },
      transformResponse: safeJson,
    });
    const routes = data
      .filter((r: any) => r.type === 1) // 1 = cycling, 2 = running
      .map((r: any) => ({
        id:             String(r.id),
        name:           r.name,
        distance:       r.distance,
        elevation_gain: r.elevation_gain,
        estimated_moving_time: r.estimated_moving_time,
        created_at:     r.created_at,
        updated_at:     r.updated_at,
      }));
    res.json(routes);
  } catch (err: any) {
    res.status(400).json({ error: err.response?.data?.message ?? 'Failed to fetch routes' });
  }
});

// POST /api/strava/analyze-route/:id  → fetch route streams + run analysis
router.post('/analyze-route/:id', analyzeLimiter, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { access_token, ftpWatts, weightKg, intensity, startDateTime } = req.body;

  if (!access_token) { res.status(401).json({ error: 'access_token required' }); return; }

  const ftp        = parseFloat(ftpWatts);
  const weight     = parseFloat(weightKg);
  const intensityN = parseFloat(intensity);
  if (isNaN(ftp)        || ftp < 50        || ftp > 700)   { res.status(400).json({ error: 'ftpWatts must be 50–700' });   return; }
  if (isNaN(weight)     || weight < 30     || weight > 200) { res.status(400).json({ error: 'weightKg must be 30–200' });   return; }
  if (isNaN(intensityN) || intensityN < 50 || intensityN > 110) { res.status(400).json({ error: 'intensity must be 50–110' }); return; }

  try {
    // Route streams return an array of { type, data } objects (different from activity streams)
    const { data: streamArr } = await axios.get(`${STRAVA_API}/routes/${id}/streams`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const find = (type: string) => streamArr.find((s: any) => s.type === type)?.data ?? [];
    const latlng:   [number, number][] = find('latlng');
    const altitude: number[]           = find('altitude');
    const distance: number[]           = find('distance');

    if (latlng.length < 2) {
      res.status(400).json({ error: 'Route has insufficient GPS data' });
      return;
    }

    const points: RoutePoint[] = latlng.map((ll, i) => ({
      lat:                 ll[0],
      lon:                 ll[1],
      elevationM:          altitude[i] ?? 0,
      distanceFromStartKm: (distance[i] ?? 0) / 1000,
    }));

    let totalGain = 0, totalLoss = 0;
    for (let i = 1; i < points.length; i++) {
      const diff = points[i].elevationM - points[i - 1].elevationM;
      if (diff > 0) totalGain += diff; else totalLoss += Math.abs(diff);
    }

    const route: ParsedRoute = {
      points,
      totalDistanceKm:     points[points.length - 1].distanceFromStartKm,
      totalElevationGainM: Math.round(totalGain),
      totalElevationLossM: Math.round(totalLoss),
      format: 'gpx',
      name:   `Strava route #${id}`,
    };

    const rider: RiderSettings = {
      ftpWatts:  ftp,
      weightKg:  weight,
      intensity: intensityN,
      ...(startDateTime ? { startDateTime } : {}),
    };

    const rideId    = crypto.randomUUID();
    const pacing    = runPacingEngine(route, rider);
    const climbs    = runClimbsEngine(route, rider, pacing);
    const nutrition = runNutritionEngine(route, rider, pacing);
    const weather   = rider.startDateTime
      ? await runWeatherEngine(route, rider as RiderSettings & { startDateTime: string }, pacing, climbs)
      : null;

    res.json({ rideId, pacing, climbs, nutrition, weather, routePoints: samplePoints(points, 500) });
  } catch (err: any) {
    const message = err.response?.data?.message ?? (err instanceof Error ? err.message : 'Analysis failed');
    console.error('Strava analyze-route error:', err);
    res.status(500).json({ error: message });
  }
});

// GET /api/strava/activities?access_token=...  → recent cycling activities
router.get('/activities', async (req: Request, res: Response) => {
  const { access_token, page = '1' } = req.query as Record<string, string>;
  if (!access_token) { res.status(401).json({ error: 'access_token required' }); return; }
  try {
    const { data } = await axios.get(`${STRAVA_API}/athlete/activities`, {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { page, per_page: 30 },
      transformResponse: safeJson,
    });
    const activities = data
      .filter((a: any) =>
        ['Ride', 'GravelRide', 'MountainBikeRide', 'VirtualRide', 'Cycling'].includes(a.sport_type ?? a.type)
        && a.map?.summary_polyline,
      )
      .map((a: any) => ({
        id:                   a.id,
        name:                 a.name,
        distance:             a.distance,
        moving_time:          a.moving_time,
        total_elevation_gain: a.total_elevation_gain,
        start_date:           a.start_date,
        type:                 a.sport_type ?? a.type,
      }));
    res.json(activities);
  } catch (err: any) {
    res.status(400).json({ error: err.response?.data?.message ?? 'Failed to fetch activities' });
  }
});

// POST /api/strava/analyze/:id  { access_token, ftpWatts, weightKg, intensity, startDateTime? }
router.post('/analyze/:id', analyzeLimiter, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { access_token, ftpWatts, weightKg, intensity, startDateTime } = req.body;

  if (!access_token) { res.status(401).json({ error: 'access_token required' }); return; }

  const ftp        = parseFloat(ftpWatts);
  const weight     = parseFloat(weightKg);
  const intensityN = parseFloat(intensity);
  if (isNaN(ftp)        || ftp < 50       || ftp > 700)   { res.status(400).json({ error: 'ftpWatts must be 50–700' });   return; }
  if (isNaN(weight)     || weight < 30    || weight > 200) { res.status(400).json({ error: 'weightKg must be 30–200' });   return; }
  if (isNaN(intensityN) || intensityN < 50 || intensityN > 110) { res.status(400).json({ error: 'intensity must be 50–110' }); return; }

  try {
    // Fetch GPS streams from Strava
    const { data: streams } = await axios.get(`${STRAVA_API}/activities/${id}/streams`, {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { keys: 'latlng,altitude,distance,time', key_by_type: true },
    });

    const latlng:   [number, number][] = streams.latlng?.data   ?? [];
    const altitude: number[]           = streams.altitude?.data ?? [];
    const distance: number[]           = streams.distance?.data ?? [];
    const time:     number[]           = streams.time?.data     ?? [];

    if (latlng.length < 2) {
      res.status(400).json({ error: 'Activity has insufficient GPS data' });
      return;
    }

    const points: RoutePoint[] = latlng.map((ll, i) => ({
      lat:                 ll[0],
      lon:                 ll[1],
      elevationM:          altitude[i] ?? 0,
      distanceFromStartKm: (distance[i] ?? 0) / 1000,
      timeOffsetSec:       time[i],
    }));

    let totalGain = 0, totalLoss = 0;
    for (let i = 1; i < points.length; i++) {
      const diff = points[i].elevationM - points[i - 1].elevationM;
      if (diff > 0) totalGain += diff; else totalLoss += Math.abs(diff);
    }

    const route: ParsedRoute = {
      points,
      totalDistanceKm:      points[points.length - 1].distanceFromStartKm,
      totalElevationGainM:  Math.round(totalGain),
      totalElevationLossM:  Math.round(totalLoss),
      format: 'gpx',
      name:   `Strava #${id}`,
    };

    const rider: RiderSettings = {
      ftpWatts:  ftp,
      weightKg:  weight,
      intensity: intensityN,
      ...(startDateTime ? { startDateTime } : {}),
    };

    const rideId    = crypto.randomUUID();
    const pacing    = runPacingEngine(route, rider);
    const climbs    = runClimbsEngine(route, rider, pacing);
    const nutrition = runNutritionEngine(route, rider, pacing);
    const weather   = rider.startDateTime
      ? await runWeatherEngine(route, rider as RiderSettings & { startDateTime: string }, pacing, climbs)
      : null;

    res.json({ rideId, pacing, climbs, nutrition, weather, routePoints: samplePoints(points, 500) });
  } catch (err: any) {
    const message = err.response?.data?.message ?? (err instanceof Error ? err.message : 'Analysis failed');
    console.error('Strava analyze error:', err);
    res.status(500).json({ error: message });
  }
});

// POST /api/strava/deauthorize  { access_token }
router.post('/deauthorize', async (req: Request, res: Response): Promise<void> => {
  const { access_token } = req.body;
  if (!access_token) { res.status(400).json({ error: 'access_token required' }); return; }
  try {
    await axios.post('https://www.strava.com/oauth/deauthorize', { access_token });
  } catch {
    // Fail silently — client will clear tokens regardless
  }
  res.json({ success: true });
});

export default router;
