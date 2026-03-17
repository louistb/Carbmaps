import React, { useState, useEffect, useRef } from 'react';
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      background: '#fff',
      borderBottom: '2px solid #000',
      padding: '0.875rem 1.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '2rem',
      flexWrap: 'wrap',
    }}>
      {/* Brand */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 700,
          fontSize: '1.25rem',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: '#000',
        }}>
          CarbMaps
        </div>
        <div style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: '0.55rem',
          color: '#999',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginTop: 3,
        }}>
          Ride Smarter
        </div>
      </div>

      {/* Intensity slider */}
      <div style={{ flex: 1, minWidth: 180, maxWidth: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: '0.62rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#999',
          }}>
            Intensity
          </span>
          <span style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: '0.7rem',
            fontWeight: 600,
            color: '#000',
          }}>
            {ftpPctToZoneName(intensity)} · {intensity.toFixed(1)}%
            {isReanalyzing && <span style={{ marginLeft: 5 }}>⟳</span>}
          </span>
        </div>
        <IntensitySlider value={intensity} onChange={handleChange} compact step={0.5} />
      </div>

      <div style={{ flexShrink: 0 }}>
        <button className="btn btn-ghost" onClick={reset}
          style={{ fontSize: '0.72rem', padding: '0.4rem 0.9rem' }}>
          ← New Ride
        </button>
      </div>
    </header>
  );
}
