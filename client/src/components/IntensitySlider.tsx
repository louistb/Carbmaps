import React from 'react';

// Slider range: 60–95 FTP %
export const SLIDER_MIN = 60;
export const SLIDER_MAX = 95;

// Zone boundaries (FTP %)
const ZONES = [
  { name: 'Casual',    from: 60, to: 65, color: '#3a6fa8' },
  { name: 'Endurance', from: 65, to: 75, color: '#2a7a5a' },
  { name: 'Tempo',     from: 75, to: 85, color: '#b88a10' },
  { name: 'Race',      from: 88, to: 95, color: '#c86030' },
];

export function ftpPctToZoneName(pct: number): string {
  if (pct <= 63) return 'Casual';
  if (pct <= 72) return 'Endurance';
  if (pct <= 83) return 'Tempo';
  return 'Race';
}

function thumbColor(pct: number): string {
  if (pct <= 63) return '#3a6fa8';
  if (pct <= 72) return '#2a7a5a';
  if (pct <= 83) return '#b88a10';
  return '#c86030';
}

/** Map FTP % to 0–100 slider position */
function toPos(pct: number): number {
  return ((pct - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
}

// Gradient segments for the track
function buildGradient(): string {
  const range = SLIDER_MAX - SLIDER_MIN;
  const stops: string[] = [];
  // gap fill
  const gapColor = '#d4cfc7';
  let prev = 0;
  for (const z of ZONES) {
    const start = ((z.from - SLIDER_MIN) / range) * 100;
    const end   = ((z.to   - SLIDER_MIN) / range) * 100;
    if (start > prev) {
      stops.push(`${gapColor} ${prev}%`, `${gapColor} ${start}%`);
    }
    stops.push(`${z.color} ${start}%`, `${z.color} ${end}%`);
    prev = end;
  }
  if (prev < 100) stops.push(`${gapColor} ${prev}%`, `${gapColor} 100%`);
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

const TRACK_GRADIENT = buildGradient();

interface Props {
  value: number;           // FTP % (60–95)
  onChange: (v: number) => void;
  step?: number;
  compact?: boolean;       // smaller version for the header
}

export function IntensitySlider({ value, onChange, step = 0.5, compact = false }: Props) {
  const zoneName  = ftpPctToZoneName(value);
  const color     = thumbColor(value);
  const fillPct   = toPos(value);

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        .intensity-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: ${compact ? 5 : 7}px;
          background: ${TRACK_GRADIENT};
          outline: none;
          cursor: pointer;
        }
        .intensity-range::-webkit-slider-runnable-track {
          height: ${compact ? 5 : 7}px;
          background: ${TRACK_GRADIENT};
        }
        .intensity-range::-moz-range-track {
          height: ${compact ? 5 : 7}px;
          background: ${TRACK_GRADIENT};
          border: none;
        }
        .intensity-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: ${compact ? 16 : 20}px;
          height: ${compact ? 16 : 20}px;
          margin-top: ${compact ? '-5.5px' : '-6.5px'};
          background: #ffffff;
          border: 2.5px solid ${color};
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .intensity-range::-moz-range-thumb {
          width: ${compact ? 16 : 20}px;
          height: ${compact ? 16 : 20}px;
          background: #ffffff;
          border: 2.5px solid ${color};
          cursor: pointer;
        }
      `}</style>

      {!compact && (
        /* Zone name + value badge above the thumb */
        <div style={{
          position: 'relative',
          height: 28,
          marginBottom: 4,
        }}>
          <div style={{
            position: 'absolute',
            left: `${fillPct}%`,
            transform: 'translateX(-50%)',
            background: color,
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.55rem',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            {zoneName} · {value.toFixed(1)}%
          </div>
        </div>
      )}

      <input
        type="range"
        className="intensity-range"
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />

      {!compact && (
        /* Zone labels below */
        <div style={{ position: 'relative', height: 22, marginTop: 4 }}>
          {ZONES.map(z => {
            const midPos = toPos((z.from + z.to) / 2);
            return (
              <span key={z.name} style={{
                position: 'absolute',
                left: `${midPos}%`,
                transform: 'translateX(-50%)',
                fontSize: '0.65rem',
                color: z.color,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>
                {z.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
