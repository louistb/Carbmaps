import { Router, Request, Response } from 'express';
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

// DELETE /api/rides/:id — nothing stored server-side, always succeeds
router.delete('/:id', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// POST /api/rides/:id/weather — refresh weather using current time as start
router.post('/:id/weather', upload.single('gpxFile'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) { res.status(400).json({ error: 'GPX file is required' }); return; }

    const { ftpWatts, weightKg, intensity, startDateTime } = req.body;
    const ftp        = parseFloat(ftpWatts);
    const weight     = parseFloat(weightKg);
    const intensityN = parseFloat(intensity);
    if (isNaN(ftp) || isNaN(weight) || isNaN(intensityN)) {
      res.status(400).json({ error: 'ftpWatts, weightKg and intensity are required' }); return;
    }
    if (!startDateTime || isNaN(Date.parse(startDateTime))) {
      res.status(400).json({ error: 'startDateTime must be a valid ISO 8601 string' }); return;
    }

    const rider = { ftpWatts: ftp, weightKg: weight, intensity: intensityN, startDateTime } as RiderSettings & { startDateTime: string };
    const route   = parseRoute(req.file.originalname, req.file.buffer);
    const pacing  = runPacingEngine(route, rider);
    const climbs  = runClimbsEngine(route, rider, pacing);
    const weather = await runWeatherEngine(route, rider, pacing, climbs);

    res.json({ weather });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Weather refresh failed';
    console.error('Weather refresh error:', err);
    res.status(500).json({ error: message });
  }
});

// POST /api/rides/:id/reanalyze — re-run engines with new intensity
// Client sends the GPX file from localStorage so no server-side storage is needed
router.post('/:id/reanalyze', upload.single('gpxFile'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'GPX file is required for reanalysis' });
      return;
    }

    const intensityN = parseFloat(req.body.intensity);
    if (isNaN(intensityN) || intensityN < 55 || intensityN > 100) {
      res.status(400).json({ error: 'intensity must be a number between 55 and 100 (FTP %)' });
      return;
    }

    const ftp    = parseFloat(req.body.ftpWatts);
    const weight = parseFloat(req.body.weightKg);
    if (isNaN(ftp) || isNaN(weight)) {
      res.status(400).json({ error: 'ftpWatts and weightKg are required' });
      return;
    }

    const rider: RiderSettings = { ftpWatts: ftp, weightKg: weight, intensity: intensityN };
    const route     = parseRoute(req.file.originalname, req.file.buffer);
    const pacing    = runPacingEngine(route, rider);
    const climbs    = runClimbsEngine(route, rider, pacing);
    const nutrition = runNutritionEngine(route, rider, pacing);

    const routePoints = sampleRoutePoints(route.points, 500);
    res.json({ rideId: req.params.id, pacing, climbs, nutrition, weather: null, routePoints });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reanalysis failed';
    console.error('Reanalysis error:', err);
    res.status(500).json({ error: message });
  }
});

export default router;
