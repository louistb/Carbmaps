import { runClimbsEngine } from './climbs.engine';
import { ParsedRoute } from '../types/route.types';
import { RiderSettings } from '../types/rider.types';
import { PacingResult, SegmentPacing } from '../types/analysis.types';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeSegment(
  index: number,
  startKm: number,
  endKm: number,
  gradient: number,
  estimatedTimeMin = 3
): SegmentPacing {
  return {
    segmentIndex: index,
    startKm,
    endKm,
    elevationM: 100,
    gradient,
    targetPowerW: 200,
    targetPowerPct: 80,
    estimatedTimeMin,
    flag: null,
  };
}

function makePacing(segments: SegmentPacing[]): PacingResult {
  return {
    segments,
    normalizedPowerW: 200,
    intensityFactor: 0.8,
    tss: 100,
    estimatedTotalTimeMin: segments.reduce((s, seg) => s + seg.estimatedTimeMin, 0),
    targetZoneLabel: 'Sweet Spot',
    targetZonePctLow: 88,
    targetZonePctHigh: 93,
  };
}

/** Build a flat route (no elevation change) spanning 0..totalKm */
function flatRoute(totalKm: number): ParsedRoute {
  const points = Array.from({ length: Math.round(totalKm * 10) + 1 }, (_, i) => ({
    lat: 0,
    lon: 0,
    elevationM: 100,
    distanceFromStartKm: i / 10,
  }));
  return {
    points,
    totalDistanceKm: totalKm,
    totalElevationGainM: 0,
    totalElevationLossM: 0,
    format: 'gpx',
  };
}

/**
 * Build a route where the section [climbStartKm, climbEndKm] rises linearly,
 * and the rest is flat.
 */
function routeWithClimb(
  totalKm: number,
  climbStartKm: number,
  climbEndKm: number,
  gainM: number
): ParsedRoute {
  const pointCount = Math.round(totalKm * 10) + 1;
  const points = Array.from({ length: pointCount }, (_, i) => {
    const distKm = i / 10;
    let elevationM = 100;
    if (distKm >= climbStartKm && distKm <= climbEndKm) {
      const progress = (distKm - climbStartKm) / (climbEndKm - climbStartKm);
      elevationM = 100 + progress * gainM;
    } else if (distKm > climbEndKm) {
      elevationM = 100 + gainM;
    }
    return { lat: 0, lon: 0, elevationM, distanceFromStartKm: distKm };
  });
  return {
    points,
    totalDistanceKm: totalKm,
    totalElevationGainM: gainM,
    totalElevationLossM: 0,
    format: 'gpx',
  };
}

const defaultRider: RiderSettings = {
  ftpWatts: 250,
  weightKg: 70,
  intensity: 75,
};

// ─── tests ──────────────────────────────────────────────────────────────────

describe('runClimbsEngine', () => {
  describe('no climbs', () => {
    it('returns empty array when all segments are flat', () => {
      const segments = [
        makeSegment(0, 0, 1, 2),
        makeSegment(1, 1, 2, 1),
        makeSegment(2, 2, 3, 3.9),
      ];
      const result = runClimbsEngine(flatRoute(3), defaultRider, makePacing(segments));
      expect(result.climbs).toHaveLength(0);
    });

    it('returns empty array for an empty segment list', () => {
      const result = runClimbsEngine(flatRoute(0), defaultRider, makePacing([]));
      expect(result.climbs).toHaveLength(0);
    });

    it('ignores a climb shorter than MIN_LENGTH_KM (0.5 km)', () => {
      // Single 0.4 km segment above the gradient threshold
      const segments = [makeSegment(0, 0, 0.4, 8)];
      const result = runClimbsEngine(flatRoute(1), defaultRider, makePacing(segments));
      expect(result.climbs).toHaveLength(0);
    });
  });

  describe('single climb detection', () => {
    it('detects one climb above the 4% gradient threshold', () => {
      const segments = [
        makeSegment(0, 0, 1, 2),
        makeSegment(1, 1, 2, 5),
        makeSegment(2, 2, 3, 6),
        makeSegment(3, 3, 4, 2),
      ];
      const result = runClimbsEngine(
        routeWithClimb(4, 1, 3, 120),
        defaultRider,
        makePacing(segments)
      );
      expect(result.climbs).toHaveLength(1);
      expect(result.climbs[0].climbNumber).toBe(1);
      expect(result.climbs[0].name).toBe('Climb 1');
    });

    it('sets startKm correctly', () => {
      const segments = [
        makeSegment(0, 0, 1, 1),
        makeSegment(1, 1, 2, 7),
        makeSegment(2, 2, 3, 8),
      ];
      const result = runClimbsEngine(
        routeWithClimb(3, 1, 3, 200),
        defaultRider,
        makePacing(segments)
      );
      expect(result.climbs[0].startKm).toBe(1);
    });

    it('calculates lengthKm correctly', () => {
      const segments = [
        makeSegment(0, 0, 1, 1),
        makeSegment(1, 1, 2, 5),
        makeSegment(2, 2, 3, 6),
        makeSegment(3, 3, 4, 5),
      ];
      const result = runClimbsEngine(
        routeWithClimb(4, 1, 4, 180),
        defaultRider,
        makePacing(segments)
      );
      expect(result.climbs[0].lengthKm).toBe(3);
    });

    it('calculates avgGradientPct as mean of climb segments', () => {
      const segments = [
        makeSegment(0, 0, 1, 1),
        makeSegment(1, 1, 2, 6),
        makeSegment(2, 2, 3, 10),
      ];
      const result = runClimbsEngine(
        routeWithClimb(3, 1, 3, 160),
        defaultRider,
        makePacing(segments)
      );
      // avg of 6 and 10 = 8.0
      expect(result.climbs[0].avgGradientPct).toBe(8.0);
    });

    it('calculates maxGradientPct correctly', () => {
      const segments = [
        makeSegment(0, 0, 1, 5),
        makeSegment(1, 1, 2, 12),
        makeSegment(2, 2, 3, 7),
      ];
      const result = runClimbsEngine(
        routeWithClimb(3, 0, 3, 240),
        defaultRider,
        makePacing(segments)
      );
      expect(result.climbs[0].maxGradientPct).toBe(12);
    });

    it('calculates estimatedDurationMin as sum of climb segments', () => {
      const segments = [
        makeSegment(0, 0, 1, 5, 4),
        makeSegment(1, 1, 2, 6, 5),
        makeSegment(2, 2, 3, 2, 3),
      ];
      const result = runClimbsEngine(
        routeWithClimb(3, 0, 2, 110),
        defaultRider,
        makePacing(segments)
      );
      // segments 0 and 1 are in the climb → 4 + 5 = 9
      expect(result.climbs[0].estimatedDurationMin).toBe(9);
    });

    it('only counts positive elevation changes for elevationGainM', () => {
      // Route that goes up then dips slightly then up again within the climb window
      const route: ParsedRoute = {
        points: [
          { lat: 0, lon: 0, elevationM: 100, distanceFromStartKm: 0 },
          { lat: 0, lon: 0, elevationM: 150, distanceFromStartKm: 1 },
          { lat: 0, lon: 0, elevationM: 130, distanceFromStartKm: 2 }, // -20 m dip (ignored)
          { lat: 0, lon: 0, elevationM: 200, distanceFromStartKm: 3 }, // +70 m
        ],
        totalDistanceKm: 3,
        totalElevationGainM: 120,
        totalElevationLossM: 20,
        format: 'gpx',
      };
      const segments = [
        makeSegment(0, 0, 1, 5),
        makeSegment(1, 1, 2, 5),
        makeSegment(2, 2, 3, 5),
      ];
      const result = runClimbsEngine(route, defaultRider, makePacing(segments));
      // +50 (100→150) ignored dip, +70 (130→200) = 120 m gain
      expect(result.climbs[0].elevationGainM).toBe(120);
    });
  });

  describe('climb merging', () => {
    it('merges two climbs separated by a gap <= MAX_GAP_KM (4 km)', () => {
      const segments = [
        makeSegment(0, 0, 1, 5),   // climb A
        makeSegment(1, 1, 2, 1),   // flat gap — 1 km
        makeSegment(2, 2, 3, 5),   // climb B
      ];
      const result = runClimbsEngine(
        routeWithClimb(3, 0, 3, 200),
        defaultRider,
        makePacing(segments)
      );
      expect(result.climbs).toHaveLength(1);
    });

    it('does NOT merge climbs separated by a gap > MAX_GAP_KM (4 km)', () => {
      const segments = [
        makeSegment(0, 0, 1, 5),   // climb A
        makeSegment(1, 1, 2, 1),
        makeSegment(2, 2, 3, 1),
        makeSegment(3, 3, 4, 1),
        makeSegment(4, 4, 5, 1),   // 4 km flat gap total
        makeSegment(5, 5, 6, 5),   // climb B — gap is exactly 4 km (endKm 1 → startKm 5)
      ];
      // gap = 5 - 1 = 4 km → should still merge (≤ 4 km condition)
      const r1 = runClimbsEngine(flatRoute(6), defaultRider, makePacing(segments));
      expect(r1.climbs).toHaveLength(1);

      // Now make the gap 4.1 km → must NOT merge
      const segments2 = [
        makeSegment(0, 0, 1, 5),
        makeSegment(1, 1, 2, 1),
        makeSegment(2, 2, 3, 1),
        makeSegment(3, 3, 4, 1),
        makeSegment(4, 4, 5, 1),
        makeSegment(5, 5.1, 6.1, 5),  // gap = 5.1 - 1 = 4.1 km
      ];
      const r2 = runClimbsEngine(flatRoute(7), defaultRider, makePacing(segments2));
      expect(r2.climbs).toHaveLength(2);
    });

    it('detects three separate climbs', () => {
      const segments = [
        makeSegment(0, 0, 1, 8),
        makeSegment(1, 1, 10, 1),   // 9 km gap
        makeSegment(2, 10, 11, 7),
        makeSegment(3, 11, 20, 1),  // 9 km gap
        makeSegment(4, 20, 21, 6),
      ];
      const result = runClimbsEngine(flatRoute(21), defaultRider, makePacing(segments));
      expect(result.climbs).toHaveLength(3);
      expect(result.climbs.map(c => c.climbNumber)).toEqual([1, 2, 3]);
    });
  });

  describe('power suggestion', () => {
    it('suggested power is within [0, ftpWatts * 1.05]', () => {
      const segments = [makeSegment(0, 0, 1, 8), makeSegment(1, 1, 2, 8)];
      const rider: RiderSettings = { ftpWatts: 300, weightKg: 70, intensity: 75 };
      const result = runClimbsEngine(
        routeWithClimb(2, 0, 2, 160),
        rider,
        makePacing(segments)
      );
      const climb = result.climbs[0];
      expect(climb.suggestedPowerW).toBeGreaterThanOrEqual(0);
      expect(climb.suggestedPowerW).toBeLessThanOrEqual(rider.ftpWatts * 1.05);
    });

    it('suggestedPowerPct reflects suggestedPowerW / ftpWatts * 100', () => {
      const segments = [makeSegment(0, 0, 1, 8), makeSegment(1, 1, 2, 8)];
      const rider: RiderSettings = { ftpWatts: 250, weightKg: 70, intensity: 80 };
      const result = runClimbsEngine(
        routeWithClimb(2, 0, 2, 160),
        rider,
        makePacing(segments)
      );
      const { suggestedPowerW, suggestedPowerPct } = result.climbs[0];
      // suggestedPowerPct is computed from unrounded watts internally, then the watts output
      // is rounded — so allow up to 0.3% tolerance (0.5W rounding / 250 FTP * 100)
      const approxPct = (suggestedPowerW / rider.ftpWatts) * 100;
      expect(suggestedPowerPct).toBeCloseTo(approxPct, 0);
    });

    it('clamps intensity at 50 (lower bound)', () => {
      const segments = [makeSegment(0, 0, 1, 8), makeSegment(1, 1, 2, 8)];
      const riderLow: RiderSettings = { ftpWatts: 250, weightKg: 70, intensity: 20 };
      const riderAt50: RiderSettings = { ftpWatts: 250, weightKg: 70, intensity: 50 };
      const route = routeWithClimb(2, 0, 2, 160);
      const pacing = makePacing(segments);
      const resultLow = runClimbsEngine(route, riderLow, pacing);
      const resultAt50 = runClimbsEngine(route, riderAt50, pacing);
      // Clamped at 50, so both should produce the same power
      expect(resultLow.climbs[0].suggestedPowerW).toBe(resultAt50.climbs[0].suggestedPowerW);
    });

    it('clamps intensity at 110 (upper bound)', () => {
      const segments = [makeSegment(0, 0, 1, 8), makeSegment(1, 1, 2, 8)];
      const riderHigh: RiderSettings = { ftpWatts: 250, weightKg: 70, intensity: 150 };
      const riderAt110: RiderSettings = { ftpWatts: 250, weightKg: 70, intensity: 110 };
      const route = routeWithClimb(2, 0, 2, 160);
      const pacing = makePacing(segments);
      const resultHigh = runClimbsEngine(route, riderHigh, pacing);
      const resultAt110 = runClimbsEngine(route, riderAt110, pacing);
      expect(resultHigh.climbs[0].suggestedPowerW).toBe(resultAt110.climbs[0].suggestedPowerW);
    });
  });

  describe('output shape', () => {
    it('climb numbers are sequential starting at 1', () => {
      const segments = [
        makeSegment(0, 0, 1, 8),
        makeSegment(1, 1, 10, 1),
        makeSegment(2, 10, 11, 7),
        makeSegment(3, 11, 20, 1),
        makeSegment(4, 20, 21, 6),
      ];
      const result = runClimbsEngine(flatRoute(21), defaultRider, makePacing(segments));
      result.climbs.forEach((c, i) => expect(c.climbNumber).toBe(i + 1));
    });

    it('climb names match climbNumber', () => {
      const segments = [
        makeSegment(0, 0, 1, 8),
        makeSegment(1, 1, 10, 1),
        makeSegment(2, 10, 11, 7),
      ];
      const result = runClimbsEngine(flatRoute(11), defaultRider, makePacing(segments));
      result.climbs.forEach(c => expect(c.name).toBe(`Climb ${c.climbNumber}`));
    });

    it('numeric fields are rounded to at most 1 decimal place', () => {
      const segments = [makeSegment(0, 0, 1, 5.333), makeSegment(1, 1, 2, 7.666)];
      const result = runClimbsEngine(
        routeWithClimb(2, 0, 2, 130),
        defaultRider,
        makePacing(segments)
      );
      const c = result.climbs[0];
      const hasAtMostOneDecimal = (n: number) => Number.isFinite(n) && Math.round(n * 10) / 10 === n;
      expect(hasAtMostOneDecimal(c.startKm)).toBe(true);
      expect(hasAtMostOneDecimal(c.lengthKm)).toBe(true);
      expect(hasAtMostOneDecimal(c.avgGradientPct)).toBe(true);
      expect(hasAtMostOneDecimal(c.maxGradientPct)).toBe(true);
      expect(hasAtMostOneDecimal(c.estimatedDurationMin)).toBe(true);
      expect(hasAtMostOneDecimal(c.suggestedPowerPct)).toBe(true);
    });
  });

  describe('climb categorisation', () => {
    // score = (elevationGainM × avgGradientPct) / 10

    it('assigns cat5 when score < 25', () => {
      // gain ≈ 20m (500m at 4%), score = (20 × 4) / 10 = 8 → cat5
      const segments = [makeSegment(0, 0, 0.5, 4.0)];
      const result = runClimbsEngine(routeWithClimb(1, 0, 0.5, 20), defaultRider, makePacing(segments));
      expect(result.climbs[0].category).toBe('cat5');
    });

    it('assigns cat4 when score is 25–60', () => {
      // gain ≈ 60m (1km at 6%), score = (60 × 6) / 10 = 36 → cat4
      const segments = [makeSegment(0, 0, 1, 6)];
      const result = runClimbsEngine(routeWithClimb(1, 0, 1, 60), defaultRider, makePacing(segments));
      expect(result.climbs[0].category).toBe('cat4');
    });

    it('assigns cat3 when score is 60–120', () => {
      // gain ≈ 100m (2km at 5%), score = (100 × 5) / 10 = 50... need higher
      // gain ≈ 140m (2km at 7%), score = (140 × 7) / 10 = 98 → cat3
      const segments = [makeSegment(0, 0, 1, 7), makeSegment(1, 1, 2, 7)];
      const result = runClimbsEngine(routeWithClimb(2, 0, 2, 140), defaultRider, makePacing(segments));
      expect(result.climbs[0].category).toBe('cat3');
    });

    it('assigns cat2 when score is 120–250', () => {
      // gain ≈ 210m (3km at 7%), score = (210 × 7) / 10 = 147 → cat2
      const segments = [makeSegment(0, 0, 1, 7), makeSegment(1, 1, 2, 7), makeSegment(2, 2, 3, 7)];
      const result = runClimbsEngine(routeWithClimb(3, 0, 3, 210), defaultRider, makePacing(segments));
      expect(result.climbs[0].category).toBe('cat2');
    });

    it('assigns cat1 when score is 250–500', () => {
      // gain ≈ 400m (5km at 8%), score = (400 × 8) / 10 = 320 → cat1
      const segs = Array.from({ length: 5 }, (_, i) => makeSegment(i, i, i + 1, 8));
      const result = runClimbsEngine(routeWithClimb(5, 0, 5, 400), defaultRider, makePacing(segs));
      expect(result.climbs[0].category).toBe('cat1');
    });

    it('assigns hc when score >= 500', () => {
      // gain ≈ 700m (7km at 10%), score = (700 × 10) / 10 = 700 → hc
      const segs = Array.from({ length: 7 }, (_, i) => makeSegment(i, i, i + 1, 10));
      const result = runClimbsEngine(routeWithClimb(7, 0, 7, 700), defaultRider, makePacing(segs));
      expect(result.climbs[0].category).toBe('hc');
    });

    it('exposes a non-negative difficultyScore', () => {
      const segments = [makeSegment(0, 0, 1, 6), makeSegment(1, 1, 2, 6)];
      const result = runClimbsEngine(routeWithClimb(2, 0, 2, 120), defaultRider, makePacing(segments));
      expect(result.climbs[0].difficultyScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('handles a single-segment climb at exactly MIN_GRADIENT_PCT (4%)', () => {
      const segments = [makeSegment(0, 0, 1, 4.0)];
      const result = runClimbsEngine(
        routeWithClimb(1, 0, 1, 40),
        defaultRider,
        makePacing(segments)
      );
      expect(result.climbs).toHaveLength(1);
    });

    it('ignores a segment at just below MIN_GRADIENT_PCT (3.99%)', () => {
      const segments = [makeSegment(0, 0, 1, 3.99)];
      const result = runClimbsEngine(flatRoute(1), defaultRider, makePacing(segments));
      expect(result.climbs).toHaveLength(0);
    });

    it('handles route with no points in a climb range gracefully (0 elevation gain)', () => {
      const segments = [makeSegment(0, 50, 52, 6)];
      const route = flatRoute(5); // route only goes to 5 km, but climb is at 50 km
      const result = runClimbsEngine(route, defaultRider, makePacing(segments));
      expect(result.climbs).toHaveLength(1);
      expect(result.climbs[0].elevationGainM).toBe(0);
    });
  });
});
