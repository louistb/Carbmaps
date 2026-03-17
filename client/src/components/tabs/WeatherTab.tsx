import React from 'react';
import { WeatherResult } from '../../types/analysis';

interface Props { data: WeatherResult; }

const ral = "'Raleway', sans-serif";

function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function weatherEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌦️';
  if (code <= 65) return '🌧️';
  if (code <= 75) return '❄️';
  if (code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌡️';
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
  } catch { return iso; }
}

function tempColor(c: number): string {
  if (c <= 5)  return '#6B8AB0';
  if (c <= 15) return '#6BA06B';
  if (c <= 25) return 'var(--text-primary)';
  if (c <= 32) return 'var(--accent-gold)';
  return '#C06050';
}

export function WeatherTab({ data }: Props) {
  const { points, advisory } = data;

  return (
    <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-base)' }}>

      {/* Advisory banner */}
      {advisory && (
        <div style={{
          border: '1.5px solid #C9A96E',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem 1rem',
          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
          background: '#FBF3E4',
        }}>
          <div style={{ fontFamily: ral, fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7A5010', flexShrink: 0 }}>Advisory</div>
          <div style={{ fontFamily: ral, fontSize: '0.875rem', color: '#7A5010', fontWeight: 500 }}>{advisory}</div>
        </div>
      )}

      {/* Weather cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {points.map((point, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>

            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ fontFamily: ral, fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{point.label}</div>
                <div style={{ fontFamily: ral, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontWeight: 500 }}>
                  {formatForecastTime(point.forecastTime)}
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                {weatherEmoji(point.weatherCode)}
              </div>
            </div>

            {/* Temperature */}
            <div>
              <div style={{ fontFamily: ral, fontWeight: 900, fontSize: '2.5rem', lineHeight: 1, color: tempColor(point.tempC), letterSpacing: '-0.04em' }}>
                {Math.round(point.tempC)}°C
              </div>
              <div style={{ fontFamily: ral, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>
                {weatherLabel(point.weatherCode)}
              </div>
            </div>

            {/* Detail rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: ral, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Wind</span>
                <span style={{ fontFamily: ral, fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  {Math.round(point.windSpeedKmh)} km/h {windDirectionLabel(point.windDirectionDeg)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: ral, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Rain prob.</span>
                <span style={{ fontFamily: ral, fontWeight: 700, fontSize: '0.82rem', color: point.precipProbPct > 60 ? '#6B8AB0' : 'var(--text-primary)' }}>
                  {point.precipProbPct}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: ral, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Coords</span>
                <span style={{ fontFamily: ral, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {point.lat.toFixed(3)}, {point.lon.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Precipitation bar */}
            <div style={{ height: '4px', background: 'var(--bg-elevated)', overflow: 'hidden', borderRadius: 2 }}>
              <div style={{
                height: '100%',
                width: `${point.precipProbPct}%`,
                background: point.precipProbPct > 60 ? '#6B8AB0' : 'var(--accent-gold)',
                borderRadius: 2,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {points.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', fontFamily: ral, color: 'var(--text-muted)' }}>
          Weather data unavailable.
        </div>
      )}

      <div style={{ fontFamily: ral, fontSize: '0.73rem', color: 'var(--text-muted)', textAlign: 'right', fontStyle: 'italic' }}>
        Weather data: Open-Meteo
      </div>
    </div>
  );
}
