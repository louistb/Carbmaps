import React, { useState, useRef } from 'react';
import { PacingResult, SegmentPacing, MapPoint } from '../../types/analysis';
import { PacingMap } from '../RouteMap';

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function intensityColor(pct: number): string {
  if (pct < 55) return '#3a6fa8';
  if (pct < 65) return '#2a7a5a';
  if (pct < 75) return '#5a9a2a';
  if (pct < 85) return '#b88a10';
  if (pct < 95) return '#c86030';
  return '#b83030';
}

function intensityLabel(pct: number): string {
  if (pct < 55) return 'Recovery';
  if (pct < 65) return 'Endurance';
  if (pct < 75) return 'Tempo';
  if (pct < 85) return 'Sweet Spot';
  if (pct < 95) return 'Threshold';
  return 'VO2max+';
}

const ZONES = [
  { label: 'Recovery',   color: '#3a6fa8', range: '<55%' },
  { label: 'Endurance',  color: '#2a7a5a', range: '55–65%' },
  { label: 'Tempo',      color: '#5a9a2a', range: '65–75%' },
  { label: 'Sweet Spot', color: '#b88a10', range: '75–85%' },
  { label: 'Threshold',  color: '#c86030', range: '85–95%' },
  { label: 'VO2max+',    color: '#b83030', range: '>95%' },
];

function PacingTimeline({ segments, onHoverKm }: { segments: SegmentPacing[]; onHoverKm: (km: number | null) => void }) {
  const [tooltip, setTooltip] = useState<{ seg: SegmentPacing; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalKm = segments[segments.length - 1]?.endKm ?? 1;

  const elevations = segments.map(s => s.elevationM);
  const validElevs = elevations.filter(e => e > 0);
  const hasElev = validElevs.length > 2 && (Math.max(...validElevs) - Math.min(...validElevs)) > 5;
  const minE = hasElev ? Math.min(...validElevs) : 0;
  const maxE = hasElev ? Math.max(...validElevs) : 100;
  const elevRange = maxE - minE || 1;
  const SVG_H = 48;

  const elevPathD = (() => {
    const pts = segments.map(seg => {
      const x = (seg.startKm / totalKm) * 1000;
      const y = SVG_H - ((seg.elevationM - minE) / elevRange) * (SVG_H * 0.88);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const last = segments[segments.length - 1];
    const lx = (last.endKm / totalKm) * 1000;
    const ly = SVG_H - ((last.elevationM - minE) / elevRange) * (SVG_H * 0.88);
    return `M0,${SVG_H} ${pts.join(' ')} L${lx.toFixed(1)},${ly.toFixed(1)} L${lx.toFixed(1)},${SVG_H} Z`;
  })();

  const step = Math.ceil(totalKm / 7);
  const ticks: number[] = [];
  for (let k = 0; k <= Math.floor(totalKm); k += step) ticks.push(k);
  const lastKm = Math.round(totalKm * 10) / 10;
  if (ticks[ticks.length - 1] !== lastKm) ticks.push(lastKm);

  function handleMouse(e: React.MouseEvent, seg: SegmentPacing) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ seg, x: e.clientX - rect.left, y: e.clientY - rect.top });
    onHoverKm((seg.startKm + seg.endKm) / 2);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>

      {/* Elevation silhouette */}
      {hasElev && (
        <svg
          viewBox={`0 0 1000 ${SVG_H}`}
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: SVG_H, marginBottom: 6 }}
        >
          <defs>
            <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#e8521e" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#e8521e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <path d={elevPathD} fill="url(#eg)" stroke="#e8521e" strokeWidth={1.5} />
        </svg>
      )}

      {/* Hold-back flag row */}
      <div style={{ position: 'relative', width: '100%', height: 14, marginBottom: 3 }}>
        {segments.filter(s => s.flag === 'hold-back').map((seg, i) => {
          const midPct = ((seg.startKm + seg.endKm) / 2 / totalKm) * 100;
          return (
            <span key={i} style={{
              position: 'absolute',
              left: `${midPct}%`,
              transform: 'translateX(-50%)',
              fontSize: 9,
              fontWeight: 800,
              color: '#d97706',
              lineHeight: 1,
            }}>
              ▼
            </span>
          );
        })}
      </div>

      {/* Intensity blocks — absolutely positioned to prevent overflow */}
      <div style={{ position: 'relative', width: '100%', height: 38, overflow: 'hidden' }}>
        {segments.map((seg, i) => {
          const leftPct  = (seg.startKm / totalKm) * 100;
          const widthPct = ((seg.endKm - seg.startKm) / totalKm) * 100;
          const color    = intensityColor(seg.targetPowerPct);
          return (
            <div
              key={i}
              onMouseEnter={e => handleMouse(e, seg)}
              onMouseMove={e => handleMouse(e, seg)}
              onMouseLeave={() => { setTooltip(null); onHoverKm(null); }}
              style={{
                position: 'absolute',
                top: 0, bottom: 0,
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                background: color,
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.3)' : 'none',
                borderTop: seg.flag === 'hold-back' ? '3px solid #d97706' : '3px solid transparent',
                cursor: 'default',
              }}
            />
          );
        })}
      </div>

      {/* Distance ticks */}
      <div style={{ position: 'relative', width: '100%', height: 22, marginTop: 4 }}>
        {ticks.map(km => (
          <div key={km} style={{
            position: 'absolute',
            left: `${(km / totalKm) * 100}%`,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}>
            <div style={{ width: 1, height: 4, background: 'var(--border-strong)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{km}km</span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {tooltip && (() => {
        const { seg, x, y } = tooltip;
        const ttW = 160;
        const cW  = containerRef.current?.offsetWidth ?? 9999;
        const left = x + ttW + 14 > cW ? x - ttW - 8 : x + 12;
        return (
          <div style={{
            position: 'absolute',
            top: Math.max(0, y - 8),
            left,
            background: '#ffffff',
            border: '1px solid #e5e0d8',
            padding: '0.65rem 0.9rem',
            fontSize: '0.78rem',
            lineHeight: 1.8,
            minWidth: ttW,
            pointerEvents: 'none',
            zIndex: 20,
          }}>
            <div style={{ fontWeight: 700, color: '#6b6560', marginBottom: 2 }}>
              {seg.startKm.toFixed(1)}–{seg.endKm.toFixed(1)} km
            </div>
            <div style={{ fontWeight: 700, color: '#e8521e' }}>
              {seg.targetPowerW}W
              <span style={{ fontWeight: 400, color: '#6b6560', marginLeft: 4 }}>
                ({seg.targetPowerPct.toFixed(1)}% FTP)
              </span>
            </div>
            <div style={{ color: intensityColor(seg.targetPowerPct), fontWeight: 600 }}>
              {intensityLabel(seg.targetPowerPct)}
            </div>
            {seg.gradient !== 0 && (
              <div style={{ color: seg.gradient > 4 ? '#e8521e' : seg.gradient < 0 ? '#0284c7' : '#6b6560' }}>
                {seg.gradient > 0 ? `↗ +${seg.gradient}%` : `↘ ${seg.gradient}%`}
              </div>
            )}
            {seg.flag === 'hold-back' && (
              <div style={{ fontWeight: 700, color: '#d97706', marginTop: 2 }}>⚠ Hold back</div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

export function PacingTab({ data, routePoints }: { data: PacingResult; routePoints: MapPoint[] }) {
  const {
    segments, normalizedPowerW, intensityFactor, tss,
    estimatedTotalTimeMin, targetZoneLabel, targetZonePctLow, targetZonePctHigh,
  } = data;

  const [hoveredKm, setHoveredKm] = useState<number | null>(null);
  const holdBackCount = segments.filter(s => s.flag === 'hold-back').length;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Stats bar */}
      <div style={{
        display: 'flex',
        gap: 0,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {[
          { label: 'Normalized Power', value: `${normalizedPowerW}W`, accent: true },
          { label: 'Intensity Factor',  value: intensityFactor.toFixed(2) },
          { label: 'TSS',               value: String(tss) },
          { label: 'Duration',          value: formatTime(estimatedTotalTimeMin) },
        ].map(({ label, value, accent }, i, arr) => (
          <div key={label} style={{
            flex: 1,
            padding: '0.9rem 1.1rem',
            borderRight: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
              {label}
            </span>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: accent ? 'var(--accent-primary)' : 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Target zone */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'rgba(232,82,30,0.08)',
          border: '1px solid rgba(232,82,30,0.22)',
          padding: '0.28rem 0.8rem',
          fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-primary)',
        }}>
          🎯 {targetZoneLabel}
        </span>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          {targetZonePctLow}–{targetZonePctHigh}% FTP
        </span>
      </div>

      {/* Timeline section */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '1.1rem',
          paddingBottom: '0.7rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
              Intensity Timeline
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 3 }}>
              {segments.length} segments · hover for details
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.73rem' }}>
            {holdBackCount > 0 && (
              <span style={{ color: '#d97706', fontWeight: 600 }}>▼ {holdBackCount} hold-back</span>
            )}
          </div>
        </div>

        <PacingTimeline segments={segments} onHoverKm={setHoveredKm} />

        {/* Map */}
        {routePoints.length >= 2 && (
          <div style={{ marginTop: '1.25rem', border: '1px solid var(--border-subtle)' }}>
            <PacingMap points={routePoints} segments={segments} hoveredKm={hoveredKm} />
          </div>
        )}

        {/* Zone legend */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem 0.8rem',
          marginTop: '1.1rem',
          paddingTop: '0.9rem',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          {ZONES.map(({ label, color, range }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-primary)', fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{range}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
