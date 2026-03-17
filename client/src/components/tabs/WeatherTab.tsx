import React from 'react';
import { WeatherResult } from '../../types/analysis';

interface Props {
  data: WeatherResult;
}

function windDirectionLabel(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function weatherEmoji(code: number): string {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 55) return '🌧️';
  if (code <= 65) return '🌧️';
  if (code <= 75) return '🌨️';
  if (code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '🌡️';
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
          background: 'rgba(224,195,91,0.1)',
          border: '1px solid rgba(224,195,91,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.875rem 1rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent-warning)', marginBottom: '0.25rem' }}>Weather Advisory</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{advisory}</div>
          </div>
        </div>
      )}

      {/* Weather cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {points.map((point, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Card header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-primary)' }}>{point.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                  {formatForecastTime(point.forecastTime)}
                </div>
              </div>
              <span style={{ fontSize: '2rem' }}>{weatherEmoji(point.weatherCode)}</span>
            </div>

            {/* Main weather info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1, color: point.tempC > 30 ? 'var(--accent-danger)' : point.tempC < 5 ? 'var(--accent-info)' : 'var(--text-primary)' }}>
                  {Math.round(point.tempC)}°C
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                  {point.weatherDescription}
                </div>
              </div>
            </div>

            {/* Detail chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💨 Wind</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: point.windSpeedKmh > 40 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                  {Math.round(point.windSpeedKmh)} km/h {windDirectionLabel(point.windDirectionDeg)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🌧️ Rain prob.</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: point.precipProbPct > 60 ? 'var(--accent-info)' : 'var(--text-primary)' }}>
                  {point.precipProbPct}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📍 Coords</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {point.lat.toFixed(3)}, {point.lon.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Precipitation bar */}
            <div>
              <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${point.precipProbPct}%`,
                  background: point.precipProbPct > 60 ? 'var(--accent-info)' : 'var(--accent-success)',
                  borderRadius: '999px',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No data fallback */}
      {points.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌐</div>
          <div>Weather data unavailable. Check your internet connection.</div>
        </div>
      )}

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        Weather data: Open-Meteo (free, no API key required)
      </div>
    </div>
  );
}
