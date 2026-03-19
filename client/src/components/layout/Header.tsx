import React, { useState, useEffect } from 'react';
import { useAnalysisStore } from '../../store/analysisStore';
import { useAnalysis } from '../../hooks/useAnalysis';
import { IntensitySlider, ftpPctToZoneName } from '../IntensitySlider';

export function Header() {
  const { reset, rideId, isReanalyzing, result } = useAnalysisStore();
  const { reanalyze } = useAnalysis();

  const initIntensity = result
    ? (result.pacing.targetZonePctLow + result.pacing.targetZonePctHigh) / 2
    : 70;

  const [intensity, setIntensity] = useState(initIntensity);

  useEffect(() => {
    if (result) {
      setIntensity((result.pacing.targetZonePctLow + result.pacing.targetZonePctHigh) / 2);
    }
  }, [result?.pacing.targetZonePctLow]);

  const handleCommit = (v: number) => {
    if (!rideId) return;
    reanalyze(rideId, v);
  };

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1.5px solid var(--border-subtle)',
      padding: '0.875rem 1.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '2rem',
      flexWrap: 'wrap',
    }}>
      {/* Brand */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          fontFamily: "'MedievalSharp', cursive",
          fontWeight: 400,
          fontSize: '1.6rem',
          letterSpacing: '0.02em',
          lineHeight: 1,
          color: 'var(--text-primary)',
        }}>
          CarbMaps
        </div>
        <div style={{
          fontFamily: "'Raleway', sans-serif",
          fontSize: '0.55rem',
          color: 'var(--accent-gold)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 700,
          marginTop: 3,
        }}>
          Eat carbs, ride hard
        </div>
      </div>

      {/* Intensity slider */}
      <div style={{ flex: 1, minWidth: 180, maxWidth: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: '0.62rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
          }}>
            Intensity
          </span>
          <span style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            {ftpPctToZoneName(intensity)} · {intensity.toFixed(1)}%
            {isReanalyzing && <span style={{ marginLeft: 5, color: 'var(--accent-gold)' }}>⟳</span>}
          </span>
        </div>
        <IntensitySlider value={intensity} onChange={setIntensity} onCommit={handleCommit} compact step={0.5} />
      </div>

      <div style={{ flexShrink: 0, marginLeft: 'auto' }}>
        <button className="btn btn-ghost" onClick={reset}
          style={{ fontSize: '0.72rem', padding: '0.4rem 0.9rem' }}>
          ← Home
        </button>
      </div>
    </header>
  );
}
