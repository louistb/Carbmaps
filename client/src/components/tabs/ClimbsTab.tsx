import React, { useState } from 'react';
import { ClimbsResult, MapPoint } from '../../types/analysis';
import { ClimbsMap } from '../RouteMap';

interface Props { data: ClimbsResult; routePoints: MapPoint[]; }

const ral = "'Raleway', sans-serif";

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function severityLabel(avg: number): string {
  if (avg >= 10) return 'Brutal';
  if (avg >= 7)  return 'Hard';
  if (avg >= 5)  return 'Moderate';
  return 'Easy';
}

function severityColor(avg: number): { bg: string; color: string; border: string } {
  if (avg >= 10) return { bg: '#F9EDEA', color: '#6B1F0A', border: '#C06050' };
  if (avg >= 7)  return { bg: '#FBF3E4', color: '#7A5010', border: '#C9A96E' };
  if (avg >= 5)  return { bg: '#F0F5E8', color: '#2A3A00', border: '#8AB06B' };
  return { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: 'var(--border-subtle)' };
}

export function ClimbsTab({ data, routePoints }: Props) {
  const { climbs } = data;
  const [hoveredClimbIdx, setHoveredClimbIdx] = useState<number | null>(null);

  if (climbs.length === 0) {
    return (
      <div style={{ padding: '5rem 2rem', textAlign: 'center', background: 'var(--bg-base)' }}>
        <div style={{ fontFamily: ral, fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          No significant climbs
        </div>
        <div style={{ fontFamily: ral, color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto' }}>
          No sustained gradients ≥4% over 500m. Enjoy the flat.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-base)' }}>

      <div style={{ fontFamily: ral, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
        {climbs.length} climb{climbs.length > 1 ? 's' : ''} detected · gradients ≥4% over ≥500m
      </div>

      <div style={{
        display: 'flex', gap: 0, alignItems: 'stretch',
        border: '1.5px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)', overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(26,26,24,0.07)',
        background: '#fff',
      }}>

        {/* Climb list */}
        <div style={{ width: '270px', flexShrink: 0, borderRight: '1.5px solid var(--border-subtle)', overflowY: 'auto', maxHeight: '440px' }}>
          {climbs.map((climb, idx) => {
            const fillPct    = Math.min(climb.avgGradientPct / 15 * 100, 100);
            const maxFillPct = Math.min(climb.maxGradientPct / 15 * 100, 100);
            const isHovered  = hoveredClimbIdx === idx;
            const sev        = severityColor(climb.avgGradientPct);

            return (
              <div
                key={climb.climbNumber}
                onMouseEnter={() => setHoveredClimbIdx(idx)}
                onMouseLeave={() => setHoveredClimbIdx(null)}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: idx < climbs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  background: isHovered ? 'var(--bg-elevated)' : '#fff',
                  cursor: 'default',
                  transition: 'background 0.12s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem', gap: '0.5rem' }}>
                  <div style={{ fontFamily: ral, fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {climb.name}
                  </div>
                  <span style={{ fontFamily: ral, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', border: `1.5px solid ${sev.border}`, borderRadius: '2px', padding: '0.1rem 0.35rem', flexShrink: 0, background: sev.bg, color: sev.color }}>
                    {severityLabel(climb.avgGradientPct)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.45rem' }}>
                  <span style={{ fontFamily: ral, fontWeight: 800, fontSize: '1.3rem', lineHeight: 1, color: 'var(--text-primary)' }}>
                    {climb.avgGradientPct.toFixed(1)}%
                  </span>
                  <span style={{ fontFamily: ral, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    avg · {climb.lengthKm.toFixed(1)}km · +{climb.elevationGainM}m
                  </span>
                </div>

                <div style={{ height: '4px', background: 'var(--bg-elevated)', overflow: 'hidden', marginBottom: '3px', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${fillPct}%`, background: 'var(--accent-gold)', borderRadius: 2 }} />
                </div>
                <div style={{ height: '3px', background: 'var(--bg-elevated)', overflow: 'hidden', marginBottom: '0.5rem', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${maxFillPct}%`, background: 'var(--border-subtle)', borderRadius: 2 }} />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', fontFamily: ral, fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  <span>{formatTime(climb.estimatedDurationMin)}</span>
                  <span>{climb.suggestedPowerW}W</span>
                  <span>{climb.suggestedPowerPct.toFixed(0)}% FTP</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map */}
        {routePoints.length >= 2 ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <ClimbsMap points={routePoints} climbs={climbs} hoveredClimbIdx={hoveredClimbIdx} />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: ral, fontSize: '0.8rem' }}>
            No map data
          </div>
        )}
      </div>
    </div>
  );
}
