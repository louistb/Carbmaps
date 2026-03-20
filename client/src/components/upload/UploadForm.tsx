import React, { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAnalysis } from '../../hooks/useAnalysis';
import { useAnalysisStore } from '../../store/analysisStore';
import { SavedRidesList } from './SavedRidesList';
import { IntensitySlider } from '../IntensitySlider';
import { StravaConnect } from '../strava/StravaConnect';
import { useStrava } from '../../hooks/useStrava';
import type { StravaRoute } from '../../hooks/useStrava';
import { analytics } from '../../lib/analytics';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.38, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1.5px solid var(--border-subtle)',
  borderRadius: 'var(--radius-sm)',
  padding: '0.7rem 1rem',
  color: 'var(--text-primary)',
  fontFamily: "'Raleway', sans-serif",
  fontSize: '0.95rem',
  fontWeight: 500,
  outline: 'none',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'Raleway', sans-serif",
  fontSize: '0.62rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: '0.4rem',
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: 44, height: 24,
        border: '1.5px solid',
        borderColor: on ? 'var(--accent-gold)' : 'var(--border-subtle)',
        background: on ? 'var(--accent-gold)' : 'transparent',
        borderRadius: 12,
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s, border-color 0.2s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: on ? 21 : 3,
        width: 14, height: 14,
        background: on ? '#fff' : 'var(--text-muted)',
        borderRadius: '50%',
        transition: 'left 0.2s, background 0.2s',
      }} />
    </button>
  );
}

export function UploadForm() {
  const { analyze } = useAnalysis();
  const { analyzeRoute } = useStrava();
  const { error } = useAnalysisStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile]                       = useState<File | null>(null);
  const [selectedRoute, setSelectedRoute]     = useState<StravaRoute | null>(null);
  const [ftp, setFtp]                         = useState(() => localStorage.getItem('carbmaps_ftp') ?? '');
  const [weight, setWeight]                   = useState(() => localStorage.getItem('carbmaps_weight') ?? '');
  const [intensity, setIntensity]             = useState(70);
  const [scheduleOn, setScheduleOn]           = useState(false);
  const [startDate, setStartDate]             = useState('');
  const [startTime, setStartTime]             = useState('09:00');
  const [dragging, setDragging]               = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setSelectedRoute(null); }
  }, []);

  const handleSelectRoute = useCallback((route: StravaRoute) => {
    setSelectedRoute(r => r?.id === route.id ? null : route);
    setFile(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ftp || !weight) return;
    localStorage.setItem('carbmaps_ftp', ftp);
    localStorage.setItem('carbmaps_weight', weight);
    const startDateTime = scheduleOn && startDate
      ? new Date(`${startDate}T${startTime}:00`).toISOString()
      : undefined;

    if (selectedRoute) {
      analytics.rideAnalysisStart('strava');
      await analyzeRoute(selectedRoute.id, selectedRoute.name, parseFloat(ftp), parseFloat(weight), intensity, startDateTime);
      return;
    }
    if (!file) return;
    analytics.rideAnalysisStart('gpx');
    const fd = new FormData();
    fd.append('gpxFile', file);
    fd.append('ftpWatts', ftp);
    fd.append('weightKg', weight);
    fd.append('intensity', String(intensity));
    if (startDateTime) fd.append('startDateTime', startDateTime);
    await analyze(fd);
  };

  const canSubmit = !!(ftp && weight && (file || selectedRoute));

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'var(--bg-base)',
      padding: '0 1.25rem 4rem',
    }}>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          textAlign: 'center',
          padding: '2.5rem 1rem 2rem',
          width: '100%',
          maxWidth: '720px',
        }}
      >
        {/* Brand lockup: logo + title inline */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
          <img
            src="/logo.png"
            alt="CarbMaps logo"
            style={{
              width: 100,
              height: 100,
              objectFit: 'contain',
              mixBlendMode: 'multiply',
              opacity: 0.85,
              flexShrink: 0,
            }}
          />
          <h1 style={{
            fontFamily: "'MedievalSharp', cursive",
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 400,
            letterSpacing: '0.02em',
            color: 'var(--text-primary)',
            lineHeight: 1,
            margin: 0,
          }}>
            CarbMaps
          </h1>
        </div>

        <div style={{
          fontFamily: "'Raleway', sans-serif",
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--accent-gold)',
          marginBottom: '0.5rem',
        }}>
          Eat carbs, ride hard
        </div>

        <div style={{
          fontFamily: "'Raleway', sans-serif",
          fontSize: '0.62rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
          opacity: 0.7,
        }}>
          v{__APP_VERSION__}
        </div>
      </motion.div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{ width: '100%', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >

        {/* Strava + GPX side by side */}
        <motion.div variants={fadeUp} className="route-picker" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)',
          gap: '0',
          alignItems: 'stretch',
        }}>
          {/* Strava panel */}
          <div>
            <StravaConnect
              onSelect={handleSelectRoute}
              selectedRouteId={selectedRoute?.id ?? null}
            />
          </div>

          {/* Vertical OR divider */}
          <div className="or-divider" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '0 1.25rem', gap: '0.5rem',
          }}>
            <div style={{ flex: 1, width: 1, background: 'var(--border-subtle)' }} />
            <span style={{
              fontFamily: "'Raleway', sans-serif",
              fontSize: '0.6rem', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}>or</span>
            <div style={{ flex: 1, width: 1, background: 'var(--border-subtle)' }} />
          </div>

          {/* Drop zone panel */}
          <div
            onDrop={selectedRoute ? undefined : handleDrop}
            onDragOver={selectedRoute ? undefined : e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={selectedRoute ? undefined : () => setDragging(false)}
            onClick={selectedRoute ? undefined : () => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${selectedRoute ? 'var(--border-subtle)' : dragging ? 'var(--accent-gold)' : file ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              background: selectedRoute ? 'var(--bg-elevated)' : dragging ? '#FBF3E4' : file ? '#FFFCF5' : '#fff',
              padding: '2rem 1.25rem',
              textAlign: 'center',
              cursor: selectedRoute ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s',
              opacity: selectedRoute ? 0.45 : 1,
              pointerEvents: selectedRoute ? 'none' : 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <input ref={fileInputRef} type="file" accept=".gpx,.fit,.tcx"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />

            {file ? (
              <div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: '#FBF3E4', border: '1.5px solid var(--accent-gold)',
                  borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.75rem',
                  marginBottom: '0.5rem',
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>GPX</span>
                </div>
                <div style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem',
                  marginBottom: '0.2rem',
                }}>{file.name}</div>
                <div style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: '0.72rem', color: 'var(--text-muted)',
                }}>
                  {(file.size / 1024).toFixed(0)} KB · click to swap
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  width: 44, height: 44,
                  background: 'var(--bg-elevated)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                  fontSize: '1.25rem',
                }}>
                  ↑
                </div>
                <div style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 700, fontSize: '1rem',
                  color: 'var(--text-primary)', marginBottom: '0.3rem',
                }}>Drop your GPX file here</div>
                <div style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: '0.75rem', color: 'var(--text-muted)',
                }}>or click to browse · .gpx .fit .tcx</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* FTP + Weight */}
        <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <div>
            <label style={labelStyle}>FTP (Watts)</label>
            <input type="number" value={ftp} onChange={e => setFtp(e.target.value)}
              placeholder="250" min={50} max={700} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-gold)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')} />
          </div>
          <div>
            <label style={labelStyle}>Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="70" min={30} max={200} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-gold)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')} />
          </div>
        </motion.div>

        {/* Intensity */}
        <motion.div variants={fadeUp}>
          <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Ride Intensity</label>
          <IntensitySlider value={intensity} onChange={setIntensity} />
        </motion.div>

        {/* Schedule & Weather toggle */}
        <motion.div variants={fadeUp} style={{
          background: '#fff',
          border: '1.5px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.875rem 1.125rem', gap: '0.75rem',
          }}>
            <div>
              <div style={{
                fontFamily: "'Raleway', sans-serif",
                fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)',
              }}>
                Schedule &amp; Weather
              </div>
              <div style={{
                fontFamily: "'Raleway', sans-serif",
                fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2,
              }}>
                {scheduleOn ? 'Weather forecast will be included' : 'Off — no weather tab'}
              </div>
            </div>
            <Toggle on={scheduleOn} onToggle={() => setScheduleOn(v => !v)} />
          </div>

          {scheduleOn && (
            <div style={{
              padding: '0.875rem 1.125rem 1.125rem',
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
              borderTop: '1px solid var(--border-subtle)',
            }}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-gold)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')} />
              </div>
              <div>
                <label style={labelStyle}>Start Time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent-gold)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')} />
              </div>
            </div>
          )}
        </motion.div>

        {error && (
          <motion.div variants={fadeUp} style={{
            border: '1.5px solid #C06050',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            fontFamily: "'Raleway', sans-serif",
            color: 'var(--accent-danger)',
            fontSize: '0.85rem',
            background: '#F9EDEA',
          }}>
            {error}
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
          <button type="submit" className="btn btn-primary" disabled={!canSubmit}
            style={{ width: '100%', fontSize: '0.8rem', padding: '1rem', letterSpacing: '0.12em' }}>
            Analyse My Ride →
          </button>
        </motion.div>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{ width: '100%', maxWidth: '720px', marginTop: '2rem' }}
      >
        <SavedRidesList />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        style={{
          marginTop: '3rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <p style={{
          fontFamily: "'Raleway', sans-serif",
          fontSize: '0.72rem',
          fontWeight: 500,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          No login needed — all data stays in your browser's local storage.{' '}
          Open source,{' '}
          <a
            href="https://github.com/louistb/Carbmaps"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent-gold)',
              fontWeight: 700,
              textDecoration: 'none',
              borderBottom: '1px solid var(--accent-gold)',
            }}
          >
            view the repository on GitHub
          </a>
          .
        </p>
        <p style={{
          fontFamily: "'Raleway', sans-serif",
          fontSize: '0.72rem',
          fontWeight: 500,
          color: 'var(--text-muted)',
        }}>
          Vibe coded by Slimshader 🥴 with love
        </p>
      </motion.div>
    </div>
  );
}
