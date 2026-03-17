import React from 'react';
import { WeatherResult } from '../../types/analysis';

interface Props { data: WeatherResult; }

const sans = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";

function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function weatherLabel(code: number): string {
  if (code === 0 || code === 1) return 'Clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 48) return 'Foggy';
  if (code <= 55) return 'Drizzle';
  if (code <= 65) return 'Rain';
  if (code <= 75) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Unknown';
}

function formatForecastTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export function WeatherTab({ data }: Props) {
  const { points, advisory } = data;

  return (
    <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Advisory banner */}
      {advisory && (
        <div style={{
          border: '2px solid #000',
          padding: '0.875rem 1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}>
          <div style={{ fontFamily: sans, fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.05em', flexShrink: 0 }}>ADVISORY</div>
          <div style={{ fontFamily: sans, fontSize: '0.875rem', color: '#333' }}>{advisory}</div>
        </div>
      )}

      {/* Weather cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {points.map((point, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e5e5e5', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: '1rem', color: '#000' }}>{point.label}</div>
                <div style={{ fontFamily: sans, fontSize: '0.72rem', color: '#999', marginTop: '0.15rem' }}>
                  {formatForecastTime(point.forecastTime)}
                </div>
              </div>
              <div style={{ fontFamily: sans, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#999', marginTop: 2 }}>
                {weatherLabel(point.weatherCode)}
              </div>
            </div>

            {/* Temperature */}
            <div>
              <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: '2.5rem', lineHeight: 1, color: '#000' }}>
                {Math.round(point.tempC)}°C
              </div>
              <div style={{ fontFamily: sans, fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                {point.weatherDescription}
              </div>
            </div>

            {/* Detail rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: sans, fontSize: '0.78rem', color: '#999' }}>Wind</span>
                <span style={{ fontFamily: sans, fontWeight: 700, fontSize: '0.82rem', color: '#000' }}>
                  {Math.round(point.windSpeedKmh)} km/h {windDirectionLabel(point.windDirectionDeg)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: sans, fontSize: '0.78rem', color: '#999' }}>Rain prob.</span>
                <span style={{ fontFamily: sans, fontWeight: 700, fontSize: '0.82rem', color: '#000' }}>
                  {point.precipProbPct}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: sans, fontSize: '0.78rem', color: '#999' }}>Coords</span>
                <span style={{ fontFamily: sans, fontSize: '0.72rem', color: '#999' }}>
                  {point.lat.toFixed(3)}, {point.lon.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Precipitation bar — flat */}
            <div style={{ height: '4px', background: '#f0f0f0', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${point.precipProbPct}%`,
                background: '#000',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {points.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', fontFamily: sans, color: '#999' }}>
          Weather data unavailable.
        </div>
      )}

      <div style={{ fontFamily: sans, fontSize: '0.73rem', color: '#ccc', textAlign: 'right' }}>
        Weather data: Open-Meteo
      </div>
    </div>
  );
}
