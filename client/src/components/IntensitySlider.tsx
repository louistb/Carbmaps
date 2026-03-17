import React from 'react';

// Slider range: 60–95 FTP %
export const SLIDER_MIN = 60;
export const SLIDER_MAX = 95;

const ZONES = [
  { name: 'Casual',    from: 60, to: 65 },
  { name: 'Endurance', from: 65, to: 75 },
  { name: 'Tempo',     from: 75, to: 85 },
  { name: 'Race',      from: 88, to: 95 },
];

export function ftpPctToZoneName(pct: number): string {
  if (pct <= 63) return 'Casual';
  if (pct <= 72) return 'Endurance';
  if (pct <= 83) return 'Tempo';
  return 'Race';
}

function toPos(pct: number): number {
  return ((pct - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
}

interface Props {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  compact?: boolean;
}

export function IntensitySlider({ value, onChange, step = 0.5, compact = false }: Props) {
  const zoneName = ftpPctToZoneName(value);
  const fillPct  = toPos(value);

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        .intensity-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: ${compact ? 3 : 5}px;
          background: var(--border-subtle);
          outline: none;
          cursor: pointer;
          border-radius: 2px;
        }
        .intensity-range::-webkit-slider-runnable-track {
          height: ${compact ? 3 : 5}px;
          background: var(--border-subtle);
          border-radius: 2px;
        }
        .intensity-range::-moz-range-track {
          height: ${compact ? 3 : 5}px;
          background: var(--border-subtle);
          border: none;
          border-radius: 2px;
        }
        .intensity-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: ${compact ? 14 : 18}px;
          height: ${compact ? 14 : 18}px;
          margin-top: ${compact ? '-5.5px' : '-6.5px'};
          background: var(--accent-gold);
          border: 2px solid #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(201,169,110,0.4);
        }
        .intensity-range::-moz-range-thumb {
          width: ${compact ? 14 : 18}px;
          height: ${compact ? 14 : 18}px;
          background: var(--accent-gold);
          border: 2px solid #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(201,169,110,0.4);
        }
      `}</style>

      {!compact && (
        <div style={{ position: 'relative', height: 26, marginBottom: 4 }}>
          <div style={{
            position: 'absolute',
            left: `${fillPct}%`,
            transform: 'translateX(-50%)',
            background: 'var(--accent-gold)',
            color: '#fff',
            fontFamily: "'Raleway', sans-serif",
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '0.2rem 0.5rem',
            borderRadius: '2px',
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
        <div style={{ position: 'relative', height: 20, marginTop: 4 }}>
          {ZONES.map(z => {
            const midPos = toPos((z.from + z.to) / 2);
            return (
              <span key={z.name} style={{
                position: 'absolute',
                left: `${midPos}%`,
                transform: 'translateX(-50%)',
                fontFamily: "'Raleway', sans-serif",
                fontSize: '0.62rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
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
