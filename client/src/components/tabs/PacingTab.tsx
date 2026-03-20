import React, { useState, useRef } from 'react';
import { PacingResult, SegmentPacing, MapPoint } from '../../types/analysis';
import { PacingMap } from '../RouteMap';

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function intensityColor(pct: number): string {
  if (pct < 55) return '#E8DDD0';
  if (pct < 65) return '#C8B89A';
  if (pct < 75) return '#A8946A';
  if (pct < 85) return '#7A6040';
  if (pct < 95) return '#4A3420';
  return '#1A1A18';
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
  { label: 'Recovery',   color: '#E8DDD0', range: '<55%' },
  { label: 'Endurance',  color: '#C8B89A', range: '55–65%' },
  { label: 'Tempo',      color: '#A8946A', range: '65–75%' },
  { label: 'Sweet Spot', color: '#7A6040', range: '75–85%' },
  { label: 'Threshold',  color: '#4A3420', range: '85–95%' },
  { label: 'VO2max+',    color: '#1A1A18', range: '>95%' },
];

const ral = "'Raleway', sans-serif";

interface RidePlanProps {
  segments:             SegmentPacing[];
  normalizedPowerW:     number;
  intensityFactor:      number;
  tss:                  number;
  estimatedTotalTimeMin: number;
  targetZoneLabel:      string;
  targetZonePctLow:     number;
  targetZonePctHigh:    number;
}

function RidePlanCard({
  segments, normalizedPowerW, intensityFactor, tss,
  estimatedTotalTimeMin, targetZoneLabel, targetZonePctLow, targetZonePctHigh,
}: RidePlanProps) {

  const ftpW = segments.length
    ? Math.round(segments[0].targetPowerW / (segments[0].targetPowerPct / 100))
    : 0;

  const zoneLowW  = Math.round(ftpW * targetZonePctLow  / 100);
  const zoneHighW = Math.round(ftpW * targetZonePctHigh / 100);

  const flatSegs    = segments.filter(s => s.gradient >= -2 && s.gradient <= 3);
  const climbSegs   = segments.filter(s => s.gradient > 3);
  const descentSegs = segments.filter(s => s.gradient < -3);

  const avgW = (segs: SegmentPacing[]) =>
    segs.length ? Math.round(segs.reduce((a, s) => a + s.targetPowerW, 0) / segs.length) : null;

  const flatW    = avgW(flatSegs);
  const climbW   = avgW(climbSegs);
  const descentW = avgW(descentSegs);

  const barMin   = Math.round(ftpW * 0.5);
  const barMax   = Math.round(ftpW * 1.05);
  const barRange = barMax - barMin;
  const toPos    = (w: number) => Math.min(100, Math.max(0, ((w - barMin) / barRange) * 100));

  const zoneLeftPct  = toPos(zoneLowW);
  const zoneWidthPct = toPos(zoneHighW) - zoneLeftPct;
  const npPct        = toPos(normalizedPowerW);
  const ftpPct       = toPos(ftpW);

  const terrain = [
    { label: 'Flat',    sub: flatSegs.length    ? `${flatSegs.length} seg`    : 'None', watts: flatW,    pct: flatW    ? Math.round(flatW    / ftpW * 100) : null, cue: 'Stay in zone. Conserve.', icon: '→' },
    { label: 'Climbs',  sub: climbSegs.length   ? `${climbSegs.length} seg`   : 'None', watts: climbW,   pct: climbW   ? Math.round(climbW   / ftpW * 100) : null, cue: "Hold steady. Don't spike.", icon: '↗' },
    { label: 'Descent', sub: descentSegs.length ? `${descentSegs.length} seg` : 'None', watts: descentW, pct: descentW ? Math.round(descentW / ftpW * 100) : null, cue: 'Recover. Spin freely.',   icon: '↘' },
  ];

  return (
    <div className="ride-plan-card" style={{ border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: '0 1px 6px rgba(26,26,24,0.07)' }}>

      {/* Top: zone label + key metrics */}
      <div className="ride-plan-top" style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1.5px solid var(--border-subtle)' }}>
        <div style={{ padding: '1.1rem 1.25rem', borderRight: '1.5px solid var(--border-subtle)', flexShrink: 0, background: 'var(--bg-elevated)' }}>
          <div style={{ fontFamily: ral, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Target Zone
          </div>
          <div style={{ fontFamily: ral, fontWeight: 900, fontSize: '1.5rem', lineHeight: 1, color: 'var(--text-primary)' }}>
            {targetZoneLabel}
          </div>
          <div style={{ fontFamily: ral, fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {targetZonePctLow}–{targetZonePctHigh}% · {zoneLowW}–{zoneHighW}W
          </div>
        </div>

        <div className="ride-plan-metrics" style={{ display: 'flex', flex: 1, flexWrap: 'wrap' }}>
          {[
            { label: 'Norm. Power', shortLabel: 'NP',  value: `${normalizedPowerW}W` },
            { label: 'Int. Factor', shortLabel: 'IF',  value: intensityFactor.toFixed(2) },
            { label: 'TSS',         shortLabel: 'TSS', value: String(tss) },
            { label: 'Duration',    shortLabel: 'Time', value: formatTime(estimatedTotalTimeMin) },
          ].map(({ label, shortLabel, value }, i, arr) => (
            <div key={label} className="ride-plan-metric-item" style={{
              flex: 1, padding: '1rem',
              borderRight: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
            }}>
              <div style={{ fontFamily: ral, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                <span className="metric-label-full" style={{ fontSize: '0.58rem', fontWeight: 700 }}>{label}</span>
                <span className="metric-label-short" style={{ fontSize: '0.58rem', fontWeight: 700, display: 'none' }}>{shortLabel}</span>
              </div>
              <div style={{ fontFamily: ral, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Power bar */}
      <div style={{ padding: '1rem 1.25rem 0.875rem', borderBottom: '1.5px solid var(--border-subtle)', background: '#fff' }}>
        <div style={{ fontFamily: ral, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
          Power Range · {barMin}W — {barMax}W
        </div>

        <div style={{ position: 'relative', height: 28, marginBottom: '1.5rem' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 5, background: 'var(--border-subtle)', transform: 'translateY(-50%)', borderRadius: 2 }} />
          <div style={{ position: 'absolute', top: '50%', left: `${zoneLeftPct}%`, width: `${zoneWidthPct}%`, height: 5, background: 'var(--accent-gold)', transform: 'translateY(-50%)', borderRadius: 2 }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${ftpPct}%`, width: 1.5, background: 'var(--border-subtle)' }} />
          <div style={{ position: 'absolute', top: 0, left: `${npPct}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ fontFamily: ral, fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              NP {normalizedPowerW}W
            </div>
            <div style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `6px solid var(--accent-gold)` }} />
          </div>
        </div>

        <div style={{ position: 'relative', height: 16 }}>
          <div style={{ position: 'absolute', left: `${zoneLeftPct}%`, transform: 'translateX(-50%)' }}>
            <div style={{ fontFamily: ral, fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-primary)' }}>{zoneLowW}W</div>
          </div>
          <div style={{ position: 'absolute', left: `${toPos(zoneHighW)}%`, transform: 'translateX(-50%)' }}>
            <div style={{ fontFamily: ral, fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-primary)' }}>{zoneHighW}W</div>
          </div>
          <div style={{ position: 'absolute', left: `${ftpPct}%`, transform: 'translateX(-50%)' }}>
            <div style={{ fontFamily: ral, fontSize: '0.58rem', color: 'var(--text-muted)' }}>FTP {ftpW}W</div>
          </div>
        </div>
      </div>

      {/* Terrain cues */}
      <div className="terrain-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'var(--bg-elevated)' }}>
        {terrain.map(({ label, sub, watts, pct, cue, icon }, i, arr) => (
          <div key={label} style={{ padding: '0.875rem 1.1rem', borderRight: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <span style={{ fontFamily: ral, fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{icon}</span>
              <span style={{ fontFamily: ral, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{label}</span>
              <span style={{ fontFamily: ral, fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{sub}</span>
            </div>
            {watts ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontFamily: ral, fontSize: '1.4rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>{watts}W</span>
                <span style={{ fontFamily: ral, fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pct}% FTP</span>
              </div>
            ) : (
              <div style={{ fontFamily: ral, fontSize: '1rem', color: 'var(--border-subtle)', marginBottom: '0.25rem' }}>—</div>
            )}
            <div style={{ fontFamily: ral, fontSize: '0.68rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{cue}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      {hasElev && (
        <svg viewBox={`0 0 1000 ${SVG_H}`} preserveAspectRatio="none"
          style={{ display: 'block', width: '100%', height: SVG_H, marginBottom: 6 }}>
          <path d={elevPathD} fill="var(--bg-elevated)" stroke="var(--border-subtle)" strokeWidth={1.5} />
        </svg>
      )}

      <div style={{ position: 'relative', width: '100%', height: 14, marginBottom: 3 }}>
        {segments.filter(s => s.flag === 'hold-back').map((seg, i) => {
          const midPct = ((seg.startKm + seg.endKm) / 2 / totalKm) * 100;
          return (
            <span key={i} style={{
              position: 'absolute', left: `${midPct}%`, transform: 'translateX(-50%)',
              fontSize: 9, fontWeight: 800, color: 'var(--accent-gold)', lineHeight: 1,
            }}>▼</span>
          );
        })}
      </div>

      <div style={{ position: 'relative', width: '100%', height: 38, overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>
        {segments.map((seg, i) => {
          const leftPct  = (seg.startKm / totalKm) * 100;
          const widthPct = ((seg.endKm - seg.startKm) / totalKm) * 100;
          return (
            <div key={i}
              onMouseEnter={e => handleMouse(e, seg)}
              onMouseMove={e => handleMouse(e, seg)}
              onMouseLeave={() => { setTooltip(null); onHoverKm(null); }}
              style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${leftPct}%`, width: `${widthPct}%`,
                background: intensityColor(seg.targetPowerPct),
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                borderTop: seg.flag === 'hold-back' ? '3px solid var(--accent-gold)' : '3px solid transparent',
                cursor: 'default',
              }}
            />
          );
        })}
      </div>

      <div style={{ position: 'relative', width: '100%', height: 22, marginTop: 4 }}>
        {ticks.map(km => (
          <div key={km} style={{ position: 'absolute', left: `${(km / totalKm) * 100}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 1, height: 4, background: 'var(--border-subtle)' }} />
            <span style={{ fontFamily: ral, fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{km}km</span>
          </div>
        ))}
      </div>

      {tooltip && (() => {
        const { seg, x, y } = tooltip;
        const ttW = 160;
        const cW  = containerRef.current?.offsetWidth ?? 9999;
        const left = x + ttW + 14 > cW ? x - ttW - 8 : x + 12;
        return (
          <div style={{
            position: 'absolute', top: Math.max(0, y - 8), left,
            background: '#fff',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 0.9rem',
            fontFamily: ral, fontSize: '0.78rem', lineHeight: 1.8,
            minWidth: ttW, pointerEvents: 'none', zIndex: 1000,
            boxShadow: '0 4px 16px rgba(26,26,24,0.12)',
          }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              {seg.startKm.toFixed(1)}–{seg.endKm.toFixed(1)} km
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {seg.targetPowerW}W
              <span style={{ fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>
                ({seg.targetPowerPct.toFixed(1)}% FTP)
              </span>
            </div>
            <div style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>
              {intensityLabel(seg.targetPowerPct)}
            </div>
            {seg.gradient !== 0 && (
              <div style={{ color: 'var(--text-secondary)' }}>
                {seg.gradient > 0 ? `↗ +${seg.gradient}%` : `↘ ${seg.gradient}%`}
              </div>
            )}
            {seg.flag === 'hold-back' && (
              <div style={{ fontWeight: 700, color: 'var(--accent-gold)', marginTop: 2 }}>▼ Hold back</div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

const REFERENCES = [
  { title: 'Modelling human endurance: power laws vs critical power', year: '2023', note: 'Open access', search: 'modelling human endurance power laws critical power 2023' },
  { title: 'Functional threshold power is not a valid marker of the maximal metabolic steady state', year: '2023', note: 'Open access manuscript on PubMed', search: 'functional threshold power not valid marker maximal metabolic steady state 2023' },
  { title: 'Relationship Between the Critical Power Test and a 20-min FTP Test in Cycling', year: '2021', note: 'Open access', search: 'critical power test 20-min FTP test cycling 2021' },
  { title: 'Comparative Effects of Pacing Strategies on Endurance Performance: systematic review + meta-analysis', year: '2024', note: 'Abstract accessible', search: 'comparative effects pacing strategies endurance performance meta-analysis 2024' },
  { title: 'Effect of different pacing strategies on 4-km cycling time trial performance', year: '2023', note: 'Open access', search: 'pacing strategies 4km cycling time trial 2023' },
  { title: 'Optimal body mass normalization of power output for accurate performance prediction over complex TT courses', year: '2025', note: 'Open access', search: 'optimal body mass normalization power output performance prediction TT courses 2025' },
];

function MethodologyPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <span style={{ width: 18, height: 18, border: '1.5px solid var(--border-subtle)', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: ral, fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>i</span>
        <span style={{ fontFamily: ral, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          {open ? 'Hide methodology' : 'How was this built?'}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: '0.75rem', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.1rem', borderBottom: '1.5px solid var(--border-subtle)', background: 'var(--text-primary)' }}>
            <div style={{ fontFamily: ral, fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Methodology &amp; Sources</div>
            <div style={{ fontFamily: ral, fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.15rem' }}>How the pacing algorithm was designed and what research it draws on</div>
          </div>
          <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff' }}>
            <div>
              <div style={{ fontFamily: ral, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>How it works</div>
              <div style={{ fontFamily: ral, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                The algorithm divides your route into segments based on gradient changes. Each segment receives a target power derived from your <strong style={{ color: 'var(--text-primary)' }}>FTP</strong> and selected intensity zone. Steeper gradients get higher relative power; descents are flagged for recovery. Segments exceeding a threshold get a "hold-back" flag.
              </div>
              <div style={{ fontFamily: ral, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '0.6rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Normalized Power (NP)</strong> and <strong style={{ color: 'var(--text-primary)' }}>Intensity Factor (IF)</strong> follow Allen &amp; Coggan methodology. <strong style={{ color: 'var(--text-primary)' }}>TSS</strong> = IF² × hours × 100.
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ fontFamily: ral, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>Key references</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {REFERENCES.map((ref, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < REFERENCES.length - 1 ? '1px solid var(--bg-elevated)' : 'none' }}>
                    <span style={{ fontFamily: ral, fontSize: '0.62rem', color: 'var(--text-muted)', flexShrink: 0, width: 16, textAlign: 'right' }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <a href={`https://scholar.google.com/scholar?q=${encodeURIComponent(ref.search)}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: ral, fontSize: '0.78rem', color: 'var(--accent-gold)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                        {ref.title}
                      </a>
                      <span style={{ fontFamily: ral, fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{ref.year} · {ref.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <div style={{ fontFamily: ral, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Note:</strong> FTP is estimated from your 20-min test (×0.95). Wind, temperature, drafting, and fatigue are not modelled. Treat targets as guides, not absolutes.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PacingTab({ data, routePoints }: { data: PacingResult; routePoints: MapPoint[] }) {
  const { segments, normalizedPowerW, intensityFactor, tss, estimatedTotalTimeMin, targetZoneLabel, targetZonePctLow, targetZonePctHigh } = data;
  const [hoveredKm, setHoveredKm] = useState<number | null>(null);
  const holdBackCount = segments.filter(s => s.flag === 'hold-back').length;

  return (
    <div className="pacing-tab-content" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', background: 'var(--bg-base)' }}>

      <RidePlanCard segments={segments} normalizedPowerW={normalizedPowerW} intensityFactor={intensityFactor} tss={tss}
        estimatedTotalTimeMin={estimatedTotalTimeMin} targetZoneLabel={targetZoneLabel}
        targetZonePctLow={targetZonePctLow} targetZonePctHigh={targetZonePctHigh} />

      <div style={{ background: '#fff', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: '0 1px 4px rgba(26,26,24,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontFamily: ral, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Intensity Timeline</div>
            <div style={{ fontFamily: ral, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
              {segments.length} segments · hover for details
            </div>
          </div>
          {holdBackCount > 0 && (
            <span style={{ fontFamily: ral, color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.73rem' }}>
              ▼ {holdBackCount} hold-back
            </span>
          )}
        </div>

        <PacingTimeline segments={segments} onHoverKm={setHoveredKm} />

        {routePoints.length >= 2 && (
          <div style={{ marginTop: '1.25rem', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <PacingMap points={routePoints} segments={segments} hoveredKm={hoveredKm} />
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1rem', marginTop: '1.1rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border-subtle)' }}>
          {ZONES.map(({ label, color, range }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, background: color, border: '1px solid var(--border-subtle)', borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontFamily: ral, fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
              <span style={{ fontFamily: ral, fontSize: '0.65rem', color: 'var(--text-muted)' }}>{range}</span>
            </div>
          ))}
        </div>

        <MethodologyPanel />
      </div>
    </div>
  );
}
