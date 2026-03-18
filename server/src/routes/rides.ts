import { Router, Request, Response } from 'express';
import { runPacingEngine } from '../engines/pacing.engine';
import { runClimbsEngine } from '../engines/climbs.engine';
import { runNutritionEngine } from '../engines/nutrition.engine';
import { RiderSettings } from '../types/rider.types';
import { ParsedRoute, RoutePoint } from '../types/route.types';
import { MapPoint } from '../types/analysis.types';

function routeFromPoints(mapPoints: MapPoint[]): ParsedRoute {
  const points: RoutePoint[] = mapPoints.map(p => ({
    lat: p.lat,
    lon: p.lon,
    elevationM: p.elevationM,
    distanceFromStartKm: p.distanceKm,
  }));

  let totalElevationGainM = 0;
  let totalElevationLossM = 0;
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].elevationM - points[i - 1].elevationM;
    if (diff > 0) totalElevationGainM += diff;
    else totalElevationLossM += Math.abs(diff);
  }

  return {
    points,
    totalDistanceKm: points[points.length - 1]?.distanceFromStartKm ?? 0,
    totalElevationGainM,
    totalElevationLossM,
    format: 'gpx',
  };
}

const router = Router();

// DELETE /api/rides/:id — nothing stored server-side, always succeeds
router.delete('/:id', (_req: Request, res: Response) => {
  res.json({ success: true });
});

// POST /api/rides/:id/reanalyze — re-run engines with new intensity
// Client sends routePoints (from localStorage) so no disk storage is needed
router.post('/:id/reanalyze', async (req: Request, res: Response): Promise<void> => {
  try {
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

    const mapPoints: MapPoint[] = req.body.routePoints;
    if (!Array.isArray(mapPoints) || mapPoints.length < 2) {
      res.status(400).json({ error: 'routePoints array is required for reanalysis' });
      return;
    }

    const rider: RiderSettings = { ftpWatts: ftp, weightKg: weight, intensity: intensityN };
    const route    = routeFromPoints(mapPoints);
    const pacing   = runPacingEngine(route, rider);
    const climbs   = runClimbsEngine(route, rider, pacing);
    const nutrition = runNutritionEngine(route, rider, pacing);

    res.json({ rideId: req.params.id, pacing, climbs, nutrition, weather: null, routePoints: mapPoints });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Reanalysis failed';
    console.error('Reanalysis error:', err);
    res.status(500).json({ error: message });
  }
});

export default router;
