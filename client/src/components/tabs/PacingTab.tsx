import React, { useState, useRef } from 'react';
import { PacingResult, SegmentPacing, MapPoint } from '../../types/analysis';
import { PacingMap } from '../RouteMap';

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Greyscale intensity — dark = harder
function intensityColor(pct: number): string {
  if (pct < 55) return '#d8d8d8';
  if (pct < 65) return '#b0b0b0';
  if (pct < 75) return '#808080';
  if (pct < 85) return '#484848';
  if (pct < 95) return '#242424';
  return '#000000';
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
  { label: 'Recovery',   color: '#d8d8d8', range: '<55%' },
  { label: 'Endurance',  color: '#b0b0b0', range: '55–65%' },
  { label: 'Tempo',      color: '#808080', range: '65–75%' },
  { label: 'Sweet Spot', color: '#484848', range: '75–85%' },
  { label: 'Threshold',  color: '#242424', range: '85–95%' },
  { label: 'VO2max+',    color: '#000000', range: '>95%' },
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

      {/* Elevation silhouette — black stroke, light grey fill */}
      {hasElev && (
        <svg
          viewBox={`0 0 1000 ${SVG_H}`}
          preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: SVG_H, marginBottom: 6 }}
        >
          <path d={elevPathD} fill="#ebebeb" stroke="#000" strokeWidth={1.5} />
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
              color: '#000',
              lineHeight: 1,
            }}>
              ▼
            </span>
          );
        })}
      </div>

      {/* Intensity blocks */}
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
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                borderTop: seg.flag === 'hold-back' ? '3px solid #000' : '3px solid transparent',
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
            <div style={{ width: 1, height: 4, background: '#000' }} />
            <span style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap' }}>{km}km</span>
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
            background: '#fff',
            border: '2px solid #000',
            padding: '0.65rem 0.9rem',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: '0.78rem',
            lineHeight: 1.8,
            minWidth: ttW,
            pointerEvents: 'none',
            zIndex: 1000,
          }}>
            <div style={{ fontWeight: 700, color: '#000', marginBottom: 2 }}>
              {seg.startKm.toFixed(1)}–{seg.endKm.toFixed(1)} km
            </div>
            <div style={{ fontWeight: 700, color: '#000' }}>
              {seg.targetPowerW}W
              <span style={{ fontWeight: 400, color: '#555', marginLeft: 4 }}>
                ({seg.targetPowerPct.toFixed(1)}% FTP)
              </span>
            </div>
            <div style={{ color: '#555', fontWeight: 600 }}>
              {intensityLabel(seg.targetPowerPct)}
            </div>
            {seg.gradient !== 0 && (
              <div style={{ color: '#000' }}>
                {seg.gradient > 0 ? `↗ +${seg.gradient}%` : `↘ ${seg.gradient}%`}
              </div>
            )}
            {seg.flag === 'hold-back' && (
              <div style={{ fontWeight: 700, color: '#000', marginTop: 2 }}>▼ Hold back</div>
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
        border: '2px solid #000',
        overflow: 'hidden',
      }}>
        {[
          { label: 'Normalized Power', value: `${normalizedPowerW}W`, bold: true },
          { label: 'Intensity Factor',  value: intensityFactor.toFixed(2) },
          { label: 'TSS',               value: String(tss) },
          { label: 'Duration',          value: formatTime(estimatedTotalTimeMin) },
        ].map(({ label, value, bold }, i, arr) => (
          <div key={label} style={{
            flex: 1,
            padding: '0.9rem 1.1rem',
            borderRight: i < arr.length - 1 ? '1px solid #ccc' : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}>
            <span style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999',
            }}>
              {label}
            </span>
            <span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '1.25rem', fontWeight: 700, color: '#000', letterSpacing: '-0.02em' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Target zone */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          border: '2px solid #000',
          padding: '0.2rem 0.75rem',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: '0.7rem', fontWeight: 700, color: '#000', letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {targetZoneLabel}
        </span>
        <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#999', fontSize: '0.8rem' }}>
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
          borderBottom: '2px solid #000',
        }}>
          <div>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: '0.95rem' }}>
              Intensity Timeline
            </div>
            <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '0.72rem', color: '#999', marginTop: 3 }}>
              {segments.length} segments · hover for details
            </div>
          </div>
          {holdBackCount > 0 && (
            <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#000', fontWeight: 600, fontSize: '0.73rem' }}>
              ▼ {holdBackCount} hold-back
            </span>
          )}
        </div>

        <PacingTimeline segments={segments} onHoverKm={setHoveredKm} />

        {/* Map */}
        {routePoints.length >= 2 && (
          <div style={{ marginTop: '1.25rem', border: '2px solid #000' }}>
            <PacingMap points={routePoints} segments={segments} hoveredKm={hoveredKm} />
          </div>
        )}

        {/* Zone legend */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem 1rem',
          marginTop: '1.1rem',
          paddingTop: '0.9rem',
          borderTop: '1px solid #ccc',
        }}>
          {ZONES.map(({ label, color, range }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, background: color, border: '1px solid #ccc', flexShrink: 0 }} />
              <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '0.68rem', color: '#000', fontWeight: 600 }}>{label}</span>
              <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '0.65rem', color: '#999' }}>{range}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
