import React, { useState } from 'react';
import { ClimbsResult, MapPoint } from '../../types/analysis';
import { ClimbsMap } from '../RouteMap';

interface Props { data: ClimbsResult; routePoints: MapPoint[]; }

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function severityColor(avg: number): string {
  if (avg >= 10) return '#e05b5b';
  if (avg >= 7)  return '#e07b39';
  if (avg >= 5)  return '#f5a623';
  return '#4caf7d';
}

function severityLabel(avg: number): string {
  if (avg >= 10) return 'Brutal';
  if (avg >= 7)  return 'Hard';
  if (avg >= 5)  return 'Moderate';
  return 'Manageable';
}

export function ClimbsTab({ data, routePoints }: Props) {
  const { climbs } = data;
  const [hoveredClimbIdx, setHoveredClimbIdx] = useState<number | null>(null);

  if (climbs.length === 0) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.6 }}>🏔️</div>
        <div style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem' }}>No significant climbs</div>
        <div style={{ color: 'var(--text-secondary)', maxWidth: '320px', margin: '0 auto' }}>
          No sustained gradients ≥4% over 500m. Enjoy the flat — your legs will thank you.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        {climbs.length} climb{climbs.length > 1 ? 's' : ''} detected · gradients ≥4% sustained over ≥500m
      </div>

      {/* Map */}
      {routePoints.length >= 2 && (
        <div style={{ border: '1px solid var(--border-subtle)' }}>
          <ClimbsMap points={routePoints} climbs={climbs} hoveredClimbIdx={hoveredClimbIdx} />
        </div>
      )}

      {climbs.map((climb, idx) => {
        const color = severityColor(climb.avgGradientPct);
        const label = severityLabel(climb.avgGradientPct);
        const fillPct = Math.min(climb.avgGradientPct / 15 * 100, 100);
        const maxFillPct = Math.min(climb.maxGradientPct / 15 * 100, 100);

        return (
          <div
            key={climb.climbNumber}
            onMouseEnter={() => setHoveredClimbIdx(idx)}
            onMouseLeave={() => setHoveredClimbIdx(null)}
            style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${color}33`,
              borderLeft: `4px solid ${color}`,
              overflow: 'hidden',
            }}>
            {/* Header row */}
            <div style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.15rem' }}>
                  {climb.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Starts at km {climb.startKm.toFixed(1)} · {climb.lengthKm.toFixed(1)} km long
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, color }}>
                    {climb.avgGradientPct.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    avg grade
                  </div>
                </div>
                <span style={{
                  background: `${color}20`,
                  color,
                  border: `1px solid ${color}40`,
                  borderRadius: '999px',
                  padding: '0.25rem 0.7rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  alignSelf: 'center',
                }}>
                  {label}
                </span>
              </div>
            </div>

            {/* Gradient bars */}
            <div style={{ padding: '0 1.5rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <span>Avg {climb.avgGradientPct.toFixed(1)}%</span>
                <span>Max {climb.maxGradientPct.toFixed(1)}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-elevated)', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ height: '100%', width: `${fillPct}%`, background: color, borderRadius: '999px', opacity: 0.9 }} />
              </div>
              <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${maxFillPct}%`, background: color, borderRadius: '999px', opacity: 0.5 }} />
              </div>
            </div>

            {/* Stats grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: 0,
              borderTop: '1px solid var(--border-subtle)',
            }}>
              {[
                { label: 'Elevation', value: `+${climb.elevationGainM}m` },
                { label: 'Duration',  value: formatTime(climb.estimatedDurationMin) },
                { label: 'Target Power', value: `${climb.suggestedPowerW}W` },
                { label: '% FTP',     value: `${climb.suggestedPowerPct.toFixed(0)}%` },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{
                  padding: '0.875rem 1.25rem',
                  borderRight: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  textAlign: 'center',
                }}>
                  <div className="label" style={{ marginBottom: '0.2rem' }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
