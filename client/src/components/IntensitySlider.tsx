import React, { useRef } from 'react';

// Slider range: 50–110 FTP %
export const SLIDER_MIN = 50;
export const SLIDER_MAX = 110;

const ZONES = [
  { name: 'Chill',        from: 50, to: 60 },
  { name: 'Endurance',    from: 60, to: 75 },
  { name: 'Tempo',        from: 75, to: 88 },
  { name: 'Race',         from: 88, to: 100 },
  { name: 'Overreaching', from: 100, to: 110 },
];

export function ftpPctToZoneName(pct: number): string {
  if (pct <= 58)  return 'Chill';
  if (pct <= 72)  return 'Endurance';
  if (pct <= 85)  return 'Tempo';
  if (pct <= 100) return 'Race';
  return 'Overreaching';
}

function toPos(pct: number): number {
  return ((pct - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
}

interface Props {
  value: number;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;  // fires once on pointer/touch release
  step?: number;
  compact?: boolean;
}

export function IntensitySlider({ value, onChange, onCommit, step = 0.5, compact = false }: Props) {
  const zoneName   = ftpPctToZoneName(value);
  const fillPct    = toPos(value);
  const latestRef  = useRef(value); // always holds the most recent value from onChange

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
        @media (max-width: 600px) {
          .intensity-range::-webkit-slider-thumb {
            width: 22px;
            height: 22px;
            margin-top: -9.5px;
          }
          .intensity-range::-moz-range-thumb {
            width: 22px;
            height: 22px;
          }
          .intensity-range::-webkit-slider-runnable-track {
            height: 3px;
          }
        }
      `}</style>

      {!compact && (
        <div style={{ position: 'relative', height: 26, marginBottom: 4 }}>
          <div style={{
            position: 'absolute',
            left: `${fillPct}%`,
            transform: fillPct < 12 ? 'translateX(0)' : fillPct > 88 ? 'translateX(-100%)' : 'translateX(-50%)',
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
        onChange={e => { const v = parseFloat(e.target.value); latestRef.current = v; onChange(v); }}
        onPointerUp={() => onCommit?.(latestRef.current)}
        onTouchEnd={() => onCommit?.(latestRef.current)}
        onKeyUp={() => onCommit?.(latestRef.current)}
      />

      {!compact && (
        <div style={{ position: 'relative', height: 20, marginTop: 4 }}>
          {ZONES.map(z => {
            const midPos = toPos((z.from + z.to) / 2);
            return (
              <span key={z.name} style={{
                position: 'absolute',
                left: `${midPos}%`,
                transform: midPos < 12 ? 'translateX(0)' : midPos > 88 ? 'translateX(-100%)' : 'translateX(-50%)',
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
