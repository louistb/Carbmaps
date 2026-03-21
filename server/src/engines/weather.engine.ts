import axios from 'axios';
import { ParsedRoute } from '../types/route.types';
import { RiderSettings } from '../types/rider.types';
import { PacingResult, ClimbsResult, WeatherResult, WeatherPoint } from '../types/analysis.types';
import { pointAtDistance } from '../utils/geo';

const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
};

function getWeatherDescription(code: number): string {
  return WEATHER_CODE_DESCRIPTIONS[code] ?? `Weather code ${code}`;
}

function addMinutesToIso(isoString: string, minutes: number): string {
  const date = new Date(isoString);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function formatHour(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().slice(0, 13) + ':00'; // YYYY-MM-DDTHH:00
}

interface SamplePoint {
  label: string;
  lat: number;
  lon: number;
  estimatedArrivalIso: string;
}

export async function runWeatherEngine(
  route: ParsedRoute,
  rider: RiderSettings & { startDateTime: string },
  pacing: PacingResult,
  climbs: ClimbsResult
): Promise<WeatherResult> {
  const totalMinutes = pacing.estimatedTotalTimeMin;
  const startIso = rider.startDateTime;

  // Build sample points: start, 25%, 50%, 75%, finish + each climb start
  const fractions = [0, 0.25, 0.5, 0.75, 1.0];
  const samplePoints: SamplePoint[] = [];

  const labels = ['Start', '25%', '50%', '75%', 'Finish'];
  for (let i = 0; i < fractions.length; i++) {
    const f = fractions[i];
    const targetKm = route.totalDistanceKm * f;
    const coord = pointAtDistance(route.points, targetKm);
    if (!coord) continue;
    const arrivalIso = addMinutesToIso(startIso, f * totalMinutes);
    samplePoints.push({ label: labels[i], lat: coord.lat, lon: coord.lon, estimatedArrivalIso: arrivalIso });
  }

  // Add climb start points, dedup within 5km
  for (const climb of climbs.climbs) {
    const coord = pointAtDistance(route.points, climb.startKm);
    if (!coord) continue;
    const arrivalIso = addMinutesToIso(startIso, (climb.startKm / route.totalDistanceKm) * totalMinutes);

    const tooClose = samplePoints.some(sp => {
      const dx = (sp.lat - coord.lat) * 111;
      const dy = (sp.lon - coord.lon) * 111;
      return Math.sqrt(dx * dx + dy * dy) < 5;
    });
    if (!tooClose) {
      samplePoints.push({ label: climb.name, lat: coord.lat, lon: coord.lon, estimatedArrivalIso: arrivalIso });
    }
  }

  // Fetch weather for all points in parallel
  const results = await Promise.allSettled(
    samplePoints.map(sp =>
      axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: sp.lat,
          longitude: sp.lon,
          hourly: 'temperature_2m,windspeed_10m,winddirection_10m,precipitation_probability,weathercode',
          forecast_days: 10,
          timezone: 'auto',
        },
        timeout: 8000,
      })
    )
  );

  const weatherPoints: WeatherPoint[] = [];
  const advisories: string[] = [];

  for (let i = 0; i < samplePoints.length; i++) {
    const sp = samplePoints[i];
    const result = results[i];

    if (result.status === 'rejected') {
      weatherPoints.push({
        label: sp.label, lat: sp.lat, lon: sp.lon,
        forecastTime: sp.estimatedArrivalIso,
        tempC: 0, windSpeedKmh: 0, windDirectionDeg: 0,
        precipProbPct: 0, weatherCode: 0,
        weatherDescription: 'Forecast unavailable',
      });
      continue;
    }

    const data = result.value.data;
    const hourlyTimes: string[] = data.hourly?.time ?? [];
    const temps: number[]       = data.hourly?.temperature_2m ?? [];
    const winds: number[]       = data.hourly?.windspeed_10m ?? [];
    const windDirs: number[]    = data.hourly?.winddirection_10m ?? [];
    const precip: number[]      = data.hourly?.precipitation_probability ?? [];
    const codes: number[]       = data.hourly?.weathercode ?? [];

    const targetDate = new Date(sp.estimatedArrivalIso);
    let bestIdx = 0, bestDiff = Infinity;
    for (let j = 0; j < hourlyTimes.length; j++) {
      const diff = Math.abs(new Date(hourlyTimes[j]).getTime() - targetDate.getTime());
      if (diff < bestDiff) { bestDiff = diff; bestIdx = j; }
    }

    const tempC           = temps[bestIdx] ?? 15;
    const windSpeedKmh    = winds[bestIdx] ?? 0;
    const windDirectionDeg = windDirs[bestIdx] ?? 0;
    const precipProbPct   = precip[bestIdx] ?? 0;
    const weatherCode     = codes[bestIdx] ?? 0;

    weatherPoints.push({
      label: sp.label, lat: sp.lat, lon: sp.lon,
      forecastTime: hourlyTimes[bestIdx] ?? sp.estimatedArrivalIso,
      tempC, windSpeedKmh, windDirectionDeg, precipProbPct, weatherCode,
      weatherDescription: getWeatherDescription(weatherCode),
    });

    if (windSpeedKmh > 40)    advisories.push(`Strong winds (${Math.round(windSpeedKmh)} km/h) expected near ${sp.label}`);
    if (precipProbPct > 60)   advisories.push(`High rain probability (${precipProbPct}%) near ${sp.label}`);
    if (tempC > 30)            advisories.push(`High temperature (${Math.round(tempC)}°C) near ${sp.label} — increase fluid intake`);
  }

  const advisory = advisories.length > 0 ? advisories.join('. ') : null;
  return { points: weatherPoints, advisory };
}
