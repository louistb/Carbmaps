import React, { useState } from 'react';
import { ClimbsResult, MapPoint } from '../../types/analysis';
import { ClimbsMap } from '../RouteMap';

interface Props { data: ClimbsResult; routePoints: MapPoint[]; }

const sans = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";

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

export function ClimbsTab({ data, routePoints }: Props) {
  const { climbs } = data;
  const [hoveredClimbIdx, setHoveredClimbIdx] = useState<number | null>(null);

  if (climbs.length === 0) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.5rem' }}>
          No significant climbs
        </div>
        <div style={{ fontFamily: sans, color: '#999', maxWidth: '320px', margin: '0 auto' }}>
          No sustained gradients ≥4% over 500m. Enjoy the flat.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      <div style={{ fontFamily: sans, color: '#999', fontSize: '0.75rem' }}>
        {climbs.length} climb{climbs.length > 1 ? 's' : ''} · gradients ≥4% over ≥500m
      </div>

      {/* Split layout: list left, map right */}
      <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', border: '2px solid #000' }}>

        {/* Climb list — left column, scrollable */}
        <div style={{
          width: '260px',
          flexShrink: 0,
          borderRight: '2px solid #000',
          overflowY: 'auto',
          maxHeight: '420px',
        }}>
          {climbs.map((climb, idx) => {
            const fillPct    = Math.min(climb.avgGradientPct / 15 * 100, 100);
            const maxFillPct = Math.min(climb.maxGradientPct / 15 * 100, 100);
            const isHovered  = hoveredClimbIdx === idx;

            return (
              <div
                key={climb.climbNumber}
                onMouseEnter={() => setHoveredClimbIdx(idx)}
                onMouseLeave={() => setHoveredClimbIdx(null)}
                style={{
                  padding: '0.65rem 0.875rem',
                  borderBottom: idx < climbs.length - 1 ? '1px solid #e5e5e5' : 'none',
                  background: isHovered ? '#f5f5f5' : '#fff',
                  cursor: 'default',
                  transition: 'background 0.1s',
                }}
              >
                {/* Name + badge row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem', gap: '0.5rem' }}>
                  <div style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontWeight: 700, fontSize: '0.88rem', color: '#000',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {climb.name}
                  </div>
                  <span style={{
                    fontFamily: sans, fontSize: '0.58rem', fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    border: '1px solid #000', padding: '0.1rem 0.35rem',
                    flexShrink: 0,
                  }}>
                    {severityLabel(climb.avgGradientPct)}
                  </span>
                </div>

                {/* Grade + distance */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: '1.3rem', lineHeight: 1 }}>
                    {climb.avgGradientPct.toFixed(1)}%
                  </span>
                  <span style={{ fontFamily: sans, fontSize: '0.68rem', color: '#999' }}>
                    avg · {climb.lengthKm.toFixed(1)}km · +{climb.elevationGainM}m
                  </span>
                </div>

                {/* Compact gradient bars */}
                <div style={{ height: '5px', background: '#f0f0f0', overflow: 'hidden', marginBottom: '3px' }}>
                  <div style={{ height: '100%', width: `${fillPct}%`, background: '#000' }} />
                </div>
                <div style={{ height: '3px', background: '#f0f0f0', overflow: 'hidden', marginBottom: '0.4rem' }}>
                  <div style={{ height: '100%', width: `${maxFillPct}%`, background: '#aaa' }} />
                </div>

                {/* Stats inline */}
                <div style={{ display: 'flex', gap: '0.75rem', fontFamily: sans, fontSize: '0.68rem', color: '#555' }}>
                  <span>{formatTime(climb.estimatedDurationMin)}</span>
                  <span>{climb.suggestedPowerW}W</span>
                  <span>{climb.suggestedPowerPct.toFixed(0)}% FTP</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Map — right, fills remaining space */}
        {routePoints.length >= 2 ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            <ClimbsMap points={routePoints} climbs={climbs} hoveredClimbIdx={hoveredClimbIdx} />
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontFamily: sans, fontSize: '0.8rem' }}>
            No map data
          </div>
        )}
      </div>
    </div>
  );
}
