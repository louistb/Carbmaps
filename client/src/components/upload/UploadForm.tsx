import React, { useRef, useState, useCallback } from 'react';
import { useAnalysis } from '../../hooks/useAnalysis';
import { useAnalysisStore } from '../../store/analysisStore';
import { SavedRidesList } from './SavedRidesList';
import { IntensitySlider } from '../IntensitySlider';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '2px solid #000',
  padding: '0.65rem 0.9rem',
  color: '#000',
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: '0.95rem',
  outline: 'none',
};

const sansLabel: React.CSSProperties = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSize: '0.62rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#999',
  display: 'block',
  marginBottom: '0.35rem',
};

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: 40, height: 22,
        border: '2px solid #000',
        background: on ? '#000' : '#fff',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.14s',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3, left: on ? 19 : 3,
        width: 12, height: 12,
        background: on ? '#fff' : '#000',
        transition: 'left 0.14s',
      }} />
    </button>
  );
}

export function UploadForm() {
  const { analyze } = useAnalysis();
  const { error } = useAnalysisStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile]             = useState<File | null>(null);
  const [ftp, setFtp]               = useState(() => localStorage.getItem('carbmaps_ftp') ?? '');
  const [weight, setWeight]         = useState(() => localStorage.getItem('carbmaps_weight') ?? '');
  const [intensity, setIntensity]   = useState(70);
  const [scheduleOn, setScheduleOn] = useState(false);
  const [startDate, setStartDate]   = useState('');
  const [startTime, setStartTime]   = useState('09:00');
  const [dragging, setDragging]     = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !ftp || !weight) return;
    localStorage.setItem('carbmaps_ftp', ftp);
    localStorage.setItem('carbmaps_weight', weight);
    const fd = new FormData();
    fd.append('gpxFile', file);
    fd.append('ftpWatts', ftp);
    fd.append('weightKg', weight);
    fd.append('intensity', String(intensity));
    if (scheduleOn && startDate) {
      const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString();
      fd.append('startDateTime', startDateTime);
    }
    await analyze(fd);
  };

  const canSubmit = !!file && !!ftp && !!weight;

  return (
    <div style={{
      padding: '4rem 2.5rem 3rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2.5rem',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: '3rem',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          color: '#000',
          lineHeight: 1,
          marginBottom: '0.5rem',
        }}>
          CarbMaps
        </h1>
        <p style={{
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
          color: '#999',
          fontSize: '0.78rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          Drop your route. Get your plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px solid #000`,
            background: dragging ? '#f0f0f0' : file ? '#f5f5f5' : '#fff',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'background 0.12s',
          }}
        >
          <input ref={fileInputRef} type="file" accept=".gpx,.fit,.tcx"
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />

          {file ? (
            <div>
              <div style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 700, color: '#000', fontSize: '0.95rem',
              }}>{file.name}</div>
              <div style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: '0.7rem', color: '#999', marginTop: '0.25rem',
              }}>
                {(file.size / 1024).toFixed(0)} KB · click to swap
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 700, fontSize: '1rem', color: '#000', marginBottom: '0.25rem',
              }}>Drop your GPX file here</div>
              <div style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: '0.72rem', color: '#999', letterSpacing: '0.05em',
              }}>or click to browse · .gpx .fit .tcx</div>
            </div>
          )}
        </div>

        {/* FTP + Weight */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={sansLabel}>FTP (Watts)</label>
            <input type="number" value={ftp} onChange={e => setFtp(e.target.value)}
              placeholder="250" min={50} max={700} style={inputStyle} />
          </div>
          <div>
            <label style={sansLabel}>Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="70" min={30} max={200} style={inputStyle} />
          </div>
        </div>

        {/* Intensity */}
        <div>
          <label style={{ ...sansLabel, marginBottom: '0.75rem' }}>Ride Intensity</label>
          <IntensitySlider value={intensity} onChange={setIntensity} />
        </div>

        {/* Schedule & Weather toggle */}
        <div style={{ border: '2px solid #000' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 1rem', gap: '0.75rem',
          }}>
            <div>
              <div style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontWeight: 700, fontSize: '0.9rem', color: '#000',
              }}>
                Schedule &amp; Weather
              </div>
              <div style={{
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: '0.68rem', color: '#999', marginTop: 2,
              }}>
                {scheduleOn ? 'Weather forecast will be included' : 'Off — no weather tab'}
              </div>
            </div>
            <Toggle on={scheduleOn} onToggle={() => setScheduleOn(v => !v)} />
          </div>

          {scheduleOn && (
            <div style={{
              padding: '0.75rem 1rem 1rem',
              display: 'flex', flexDirection: 'column', gap: '0.65rem',
              borderTop: '1px solid #ccc',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label style={sansLabel}>Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={sansLabel}>Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inputStyle} />
                </div>
              </div>

            </div>
          )}
        </div>

        {error && (
          <div style={{
            border: '2px solid #000',
            padding: '0.7rem 1rem',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            color: '#000',
            fontSize: '0.85rem',
            background: '#f5f5f5',
          }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={!canSubmit}
          style={{ fontSize: '0.78rem', padding: '0.9rem', letterSpacing: '0.1em' }}>
          Analyse My Ride →
        </button>
      </form>

      <SavedRidesList />
    </div>
  );
}
