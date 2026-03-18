import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import { parseRoute } from '../ingestion';
import { runPacingEngine } from '../engines/pacing.engine';
import { runClimbsEngine } from '../engines/climbs.engine';
import { runNutritionEngine } from '../engines/nutrition.engine';
import { runWeatherEngine } from '../engines/weather.engine';
import { RiderSettings } from '../types/rider.types';
import { RoutePoint } from '../types/route.types';
import { MapPoint } from '../types/analysis.types';

function sampleRoutePoints(points: RoutePoint[], maxN: number): MapPoint[] {
  const src = points.length <= maxN ? points : Array.from(
    { length: maxN },
    (_, i) => points[Math.round(i * (points.length - 1) / (maxN - 1))]
  );
  return src.map(p => ({ lat: p.lat, lon: p.lon, distanceKm: p.distanceFromStartKm, elevationM: p.elevationM }));
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.single('gpxFile'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No GPX file uploaded' });
      return;
    }

    const { ftpWatts, weightKg, intensity, startDateTime } = req.body;

    const ftp        = parseFloat(ftpWatts);
    const weight     = parseFloat(weightKg);
    const intensityN = parseFloat(intensity);

    if (isNaN(ftp) || ftp < 50 || ftp > 700) {
      res.status(400).json({ error: 'ftpWatts must be a number between 50 and 700' }); return;
    }
    if (isNaN(weight) || weight < 30 || weight > 200) {
      res.status(400).json({ error: 'weightKg must be a number between 30 and 200' }); return;
    }
    if (isNaN(intensityN) || intensityN < 55 || intensityN > 100) {
      res.status(400).json({ error: 'intensity must be a number between 55 and 100 (FTP %)' }); return;
    }
    if (startDateTime && isNaN(Date.parse(startDateTime))) {
      res.status(400).json({ error: 'startDateTime must be a valid ISO 8601 date string' }); return;
    }

    const rider: RiderSettings = {
      ftpWatts: ftp,
      weightKg: weight,
      intensity: intensityN,
      ...(startDateTime ? { startDateTime } : {}),
    };

    const rideId    = crypto.randomUUID();
    const route     = parseRoute(req.file.originalname, req.file.buffer);
    const pacing    = runPacingEngine(route, rider);
    const climbs    = runClimbsEngine(route, rider, pacing);
    const nutrition = runNutritionEngine(route, rider, pacing);
    const weather   = rider.startDateTime
      ? await runWeatherEngine(route, rider as RiderSettings & { startDateTime: string }, pacing, climbs)
      : null;

    const routePoints = sampleRoutePoints(route.points, 500);
    res.json({ rideId, pacing, climbs, nutrition, weather, routePoints });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('Analysis error:', err);
    res.status(500).json({ error: message });
  }
});

export default router;
