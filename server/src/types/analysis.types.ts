export interface SegmentPacing {
  segmentIndex: number;
  startKm: number;
  endKm: number;
  elevationM: number;
  gradient: number;
  targetPowerW: number;
  targetPowerPct: number;
  estimatedTimeMin: number;
  flag: 'hold-back' | null;
}

export interface PacingResult {
  segments: SegmentPacing[];
  normalizedPowerW: number;
  intensityFactor: number;
  tss: number;
  estimatedTotalTimeMin: number;
  targetZoneLabel: string;
  targetZonePctLow: number;
  targetZonePctHigh: number;
}

export interface ClimbData {
  climbNumber: number;
  name: string;
  startKm: number;
  lengthKm: number;
  elevationGainM: number;
  avgGradientPct: number;
  maxGradientPct: number;
  estimatedDurationMin: number;
  suggestedPowerW: number;
  suggestedPowerPct: number;
}

export interface ClimbsResult {
  climbs: ClimbData[];
}

export interface HourlyNutrition {
  hour: number;
  carbsG: number;
  fluidMl: number;
  sodiumMg: number;
  suggestions: string[];
}

export interface NutritionResult {
  totalKcal: number;
  totalCarbsG: number;
  totalFluidMl: number;
  totalSodiumMg: number;
  carbsPerHour: number;
  fluidPerHourMl: number;
  sodiumPerHourMg: number;
  hourlyPlan: HourlyNutrition[];
  estimatedDurationHours: number;
}

export interface WeatherPoint {
  label: string;
  lat: number;
  lon: number;
  forecastTime: string;
  tempC: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  precipProbPct: number;
  weatherCode: number;
  weatherDescription: string;
}

export interface WeatherResult {
  points: WeatherPoint[];
  advisory: string | null;
}

export interface MapPoint {
  lat: number;
  lon: number;
  distanceKm: number;
  elevationM: number;
}

export interface AnalysisResult {
  pacing: PacingResult;
  climbs: ClimbsResult;
  nutrition: NutritionResult;
  weather: WeatherResult | null;
  routePoints: MapPoint[];
}
