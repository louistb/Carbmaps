import React, { useState, useEffect, useRef } from 'react';
import { useAnalysisStore } from '../../store/analysisStore';
import { useAnalysis } from '../../hooks/useAnalysis';
import { CarbMapLogo } from '../CarbMapLogo';
import { IntensitySlider, ftpPctToZoneName } from '../IntensitySlider';

export function Header() {
  const { reset, rideId, isReanalyzing, result } = useAnalysisStore();
  const { reanalyze } = useAnalysis();

  const initIntensity = result
    ? (result.pacing.targetZonePctLow + result.pacing.targetZonePctHigh) / 2
    : 70;

  const [intensity, setIntensity] = useState(initIntensity);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync slider when a reanalysis result arrives
  useEffect(() => {
    if (result) {
      setIntensity((result.pacing.targetZonePctLow + result.pacing.targetZonePctHigh) / 2);
    }
  }, [result?.pacing.targetZonePctLow]);

  const handleChange = (v: number) => {
    setIntensity(v);
    if (!rideId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => reanalyze(rideId, v), 500);
  };

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0.875rem 1.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      flexWrap: 'wrap',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <CarbMapLogo size={36} />
        <div>
          <div style={{
            fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.03em', lineHeight: 1,
            color: 'var(--accent-primary)',
          }}>
            CarbMap
          </div>
          <div style={{ fontSize: '0.56rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Ride Smarter
          </div>
        </div>
      </div>

      {/* Intensity re-analysis slider */}
      <div style={{ flex: 1, minWidth: 180, maxWidth: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
            Intensity
          </span>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {ftpPctToZoneName(intensity)} · {intensity.toFixed(1)}%
            {isReanalyzing && <span style={{ marginLeft: 5, color: 'var(--accent-primary)' }}>⟳</span>}
          </span>
        </div>
        <IntensitySlider
          value={intensity}
          onChange={handleChange}
          compact
          step={0.5}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button className="btn btn-ghost" onClick={reset} style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem' }}>
          ← New Ride
        </button>
      </div>
    </header>
  );
}
