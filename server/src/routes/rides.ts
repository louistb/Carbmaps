import { Router, Request, Response } from 'express';
import { getGpxBuffer, deleteGpx } from '../db/rides';
import { parseRoute } from '../ingestion';
import { runPacingEngine } from '../engines/pacing.engine';
import { runClimbsEngine } from '../engines/climbs.engine';
import { runNutritionEngine } from '../engines/nutrition.engine';
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

// DELETE /api/rides/:id — clean up GPX file from server
router.delete('/:id', (req: Request, res: Response) => {
  try {
    deleteGpx(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete ride' });
  }
});

// POST /api/rides/:id/reanalyze — re-run engines with new intensity
router.post('/:id/reanalyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const intensityN = parseFloat(req.body.intensity);
    if (isNaN(intensityN) || intensityN < 55 || intensityN > 100) {
      res.status(400).json({ error: 'intensity must be a number between 55 and 100 (FTP %)' });
      return;
    }

    // Read stored rider settings from request body (sent by client)
    const ftp    = parseFloat(req.body.ftpWatts);
    const weight = parseFloat(req.body.weightKg);
    if (isNaN(ftp) || isNaN(weight)) {
      res.status(400).json({ error: 'ftpWatts and weightKg are required' });
      return;
    }

    const gpxBuffer = getGpxBuffer(req.params.id);
    if (!gpxBuffer) { res.status(404).json({ error: 'GPX file not found for this ride' }); return; }

    const rider: RiderSettings = { ftpWatts: ftp, weightKg: weight, intensity: intensityN };
    const route    = parseRoute(`${req.params.id}.gpx`, gpxBuffer);
    const pacing   = runPacingEngine(route, rider);
    const climbs   = runClimbsEngine(route, rider, pacing);
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
