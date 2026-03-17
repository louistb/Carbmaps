import React, { useRef, useState, useCallback } from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { useAnalysisStore } from '../../store/analysisStore';
import { SavedRidesList } from './SavedRidesList';
import { CarbMapLogo } from '../CarbMapLogo';
import { IntensitySlider } from '../IntensitySlider';
import { LocationInput } from '../LocationInput';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-md)',
  padding: '0.65rem 1rem',
  color: 'var(--text-primary)',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.14s',
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: 40, height: 22,
        border: 'none',
        background: on ? 'var(--accent-primary)' : 'var(--border-strong)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.18s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: on ? 21 : 3,
        width: 16, height: 16,
        background: '#fff',
        transition: 'left 0.18s',
      }} />
    </button>
  );
}

export function UploadForm() {
  const { analyze } = useAnalysis();
  const { error } = useAnalysisStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile]               = useState<File | null>(null);
  const [ftp, setFtp]                 = useState(() => localStorage.getItem('carbmap_ftp') ?? '');
  const [weight, setWeight]           = useState(() => localStorage.getItem('carbmap_weight') ?? '');
  const [intensity, setIntensity]     = useState(70); // 70% FTP = Endurance
  const [scheduleOn, setScheduleOn]   = useState(false);
  const [startDate, setStartDate]     = useState('');
  const [startTime, setStartTime]     = useState('09:00');
  const [location, setLocation]       = useState('');
  const [dragging, setDragging]       = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !ftp || !weight) return;
    localStorage.setItem('carbmap_ftp', ftp);
    localStorage.setItem('carbmap_weight', weight);
    const fd = new FormData();
    fd.append('gpxFile', file);
    fd.append('ftpWatts', ftp);
    fd.append('weightKg', weight);
    fd.append('intensity', String(intensity));
    if (scheduleOn && startDate) {
      const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
      fd.append('startDateTime', startDateTime);
    }
    if (location.trim()) fd.append('location', location.trim());
    await analyze(fd);
  };

  const canSubmit = !!file && !!ftp && !!weight;

  return (
    <div style={{
      padding: '3rem 2.5rem 2.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <CarbMapLogo size={72} />
        <div>
          <h1 style={{
            fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.04em',
            color: 'var(--accent-primary)',
            marginBottom: '0.3rem',
          }}>
            CarbMap
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Drop your route. Get your plan.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent-primary)' : file ? 'var(--accent-success)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-xl)',
            background: dragging ? 'rgba(232,82,30,0.04)' : file ? 'rgba(22,163,74,0.04)' : 'var(--bg-elevated)',
            padding: '1.6rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >
          <input ref={fileInputRef} type="file" accept=".gpx,.fit,.tcx"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
          <div style={{ fontSize: '1.8rem', marginBottom: '0.35rem' }}>{file ? '✅' : '📁'}</div>
          {file ? (
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-success)', fontSize: '0.88rem' }}>{file.name}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                {(file.size / 1024).toFixed(0)} KB · click to swap
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.12rem', color: 'var(--text-primary)' }}>Drop your GPX file here</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>or click to browse · .gpx .fit .tcx</div>
            </div>
          )}
        </div>

        {/* FTP + Weight */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>FTP (Watts)</label>
            <input type="number" value={ftp} onChange={e => setFtp(e.target.value)}
              placeholder="250" min={50} max={700} style={inputStyle} />
          </div>
          <div>
            <label className="label" style={{ display: 'block', marginBottom: '0.35rem' }}>Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="70" min={30} max={200} style={inputStyle} />
          </div>
        </div>

        {/* Intensity */}
        <div style={{ padding: '0.1rem 0' }}>
          <label className="label" style={{ display: 'block', marginBottom: '0.75rem' }}>Ride Intensity</label>
          <IntensitySlider value={intensity} onChange={setIntensity} />
        </div>

        {/* Schedule & Weather toggle */}
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          {/* Toggle row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 1rem', gap: '0.75rem',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                🌤️ Schedule &amp; Weather
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {scheduleOn ? 'Weather forecast will be included' : 'Off — no weather tab'}
              </div>
            </div>
            <Toggle on={scheduleOn} onToggle={() => setScheduleOn(v => !v)} />
          </div>

          {/* Expanded fields */}
          {scheduleOn && (
            <div style={{
              padding: '0 1rem 0.9rem',
              display: 'flex', flexDirection: 'column', gap: '0.65rem',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.75rem',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: '0.3rem' }}>Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: '0.3rem' }}>Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '0.3rem' }}>
                  Start Location <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· optional</span>
                </label>
                <LocationInput value={location} onChange={setLocation} />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: 'var(--radius-md)', padding: '0.7rem 1rem',
            color: 'var(--accent-danger)', fontSize: '0.85rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={!canSubmit}
          style={{ fontSize: '0.92rem', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
          🚴 Analyse My Ride →
        </button>
      </form>

      <SavedRidesList />
    </div>
  );
}
