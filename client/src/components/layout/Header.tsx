import React, { useState, useEffect } from 'react';
import { useAnalysisStore } from '../../store/analysisStore';
import { useAnalysis } from '../../hooks/useAnalysis';
import { IntensitySlider, ftpPctToZoneName } from '../IntensitySlider';

export function Header() {
  const { reset, rideId, isReanalyzing, result } = useAnalysisStore();
  const { reanalyze, refreshWeather } = useAnalysis();

  // Derive initial start date/time from existing weather data if present
  const existingForecastTime = result?.weather?.points?.[0]?.forecastTime;
  const initDate = existingForecastTime
    ? new Date(existingForecastTime).toISOString().slice(0, 10)
    : '';
  const initTime = existingForecastTime
    ? new Date(existingForecastTime).toTimeString().slice(0, 5)
    : '09:00';

  const [weatherDate, setWeatherDate] = useState(initDate);
  const [weatherTime, setWeatherTime] = useState(initTime);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
  const [weatherOpen, setWeatherOpen] = useState(false);

  // Sync inputs when a new result loads (e.g. opening a saved ride)
  useEffect(() => {
    if (existingForecastTime) {
      setWeatherDate(new Date(existingForecastTime).toISOString().slice(0, 10));
      setWeatherTime(new Date(existingForecastTime).toTimeString().slice(0, 5));
    }
  }, [existingForecastTime]);

  const handleWeatherRefresh = async () => {
    if (!rideId) return;
    setIsRefreshingWeather(true);
    try {
      const startDateTime = weatherDate
        ? new Date(`${weatherDate}T${weatherTime}:00`).toISOString()
        : undefined;
      await refreshWeather(rideId, startDateTime);
      setWeatherOpen(false);
    } finally {
      setIsRefreshingWeather(false);
    }
  };

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

  const totalKm = result?.pacing.segments.length
    ? result.pacing.segments[result.pacing.segments.length - 1].endKm
    : 0;

  const totalElevGain = result?.routePoints && result.routePoints.length > 1
    ? Math.round(result.routePoints.reduce((acc, pt, i, arr) => {
        if (i === 0) return acc;
        const diff = pt.elevationM - arr[i - 1].elevationM;
        return acc + (diff > 0 ? diff : 0);
      }, 0))
    : result?.climbs.climbs.reduce((sum, c) => sum + c.elevationGainM, 0) ?? 0;

  const ral = "'Raleway', sans-serif";

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1.5px solid var(--border-subtle)',
      padding: '0.875rem 1.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      flexWrap: 'wrap',
    }}>
      {/* Brand — order 1 on both */}
      <div className="header-logo" style={{ flexShrink: 0 }}>
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
          fontFamily: ral,
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

      {/* Slider block — order 2 on desktop, order 3 (full width) on mobile */}
      <div className="header-slider-block" style={{ flex: 1, minWidth: 180, maxWidth: 340 }}>

        {/* Stats: big on desktop, compact single-line on mobile */}
        {totalKm > 0 && (
          <>
            {/* Desktop stats */}
            <div className="header-stats-full" style={{
              display: 'flex', gap: '1.25rem', marginBottom: '0.45rem', fontFamily: ral,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: '0.52rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Distance</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {totalKm.toFixed(1)} <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-secondary)' }}>km</span>
                </span>
              </div>
              <div style={{ width: 1, background: 'var(--border-subtle)', alignSelf: 'stretch' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: '0.52rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Elevation</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  +{totalElevGain.toLocaleString()} <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-secondary)' }}>m</span>
                </span>
              </div>
            </div>

            {/* Mobile stats — compact single line */}
            <div className="header-stats-compact" style={{
              display: 'none', marginBottom: '0.4rem', fontFamily: ral,
              fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)',
            }}>
              {totalKm.toFixed(1)} km
              <span style={{ color: 'var(--border-subtle)', margin: '0 0.4rem' }}>·</span>
              +{totalElevGain.toLocaleString()} m
            </div>
          </>
        )}

        {/* Intensity slider */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontFamily: ral, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            Intensity
          </span>
          <span style={{ fontFamily: ral, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {ftpPctToZoneName(intensity)} · {intensity.toFixed(1)}%
            {isReanalyzing && <span style={{ marginLeft: 5, color: 'var(--accent-gold)' }}>⟳</span>}
          </span>
        </div>
        <IntensitySlider value={intensity} onChange={setIntensity} onCommit={handleCommit} compact step={0.5} />
      </div>

      {/* Home button — order 3 on desktop, order 2 on mobile */}
      <div className="header-home-btn" style={{ flexShrink: 0, marginLeft: 'auto' }}>
        <button className="btn btn-ghost" onClick={reset}
          style={{ fontSize: '0.72rem', padding: '0.4rem 0.9rem' }}>
          ← Home
        </button>
      </div>

      {/* Change start time button — order 4 on desktop, order 5 (bottom) on mobile */}
      <div className="header-starttime" style={{ flexShrink: 0 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setWeatherOpen(v => !v)}
          style={{ fontSize: '0.72rem', padding: '0.4rem 0.9rem', whiteSpace: 'nowrap' }}
        >
          ⏱ Change start time
        </button>
      </div>

      {/* Start time panel — full-width row when open */}
      {weatherOpen && (
        <div className="header-starttime-panel" style={{
          flex: '0 0 100%',
          display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <span style={{ fontFamily: ral, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Start date &amp; time
          </span>
          <input
            type="date"
            value={weatherDate}
            onChange={e => setWeatherDate(e.target.value)}
            style={{
              fontSize: '0.8rem', fontFamily: ral,
              border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
              padding: '0.4rem 0.6rem', background: '#fff', color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <input
            type="time"
            value={weatherTime}
            onChange={e => setWeatherTime(e.target.value)}
            style={{
              fontSize: '0.8rem', fontFamily: ral,
              border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)',
              padding: '0.4rem 0.6rem', background: '#fff', color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleWeatherRefresh}
            disabled={isRefreshingWeather || !weatherDate}
            style={{ fontSize: '0.72rem', padding: '0.4rem 1rem', letterSpacing: '0.08em' }}
          >
            {isRefreshingWeather ? 'Updating…' : '↻ Update weather'}
          </button>
          <button
            type="button"
            onClick={() => setWeatherOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: ral, fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0.4rem 0.2rem' }}
          >
            Cancel
          </button>
        </div>
      )}
    </header>
  );
}
