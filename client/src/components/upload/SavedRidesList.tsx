import React, { useEffect } from 'react';
import { useAnalysisStore } from '../../store/analysisStore';
import { useAnalysis } from '../../hooks/useAnalysis';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return iso; }
}

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function SavedRidesList() {
  const { savedRides } = useAnalysisStore();
  const { fetchSavedRides, loadRide, deleteRide } = useAnalysis();

  useEffect(() => { fetchSavedRides(); }, []);

  if (savedRides.length === 0) return null;

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        marginBottom: '1rem',
      }}>
        <span style={{
          fontFamily: "'Raleway', sans-serif",
          fontSize: '0.62rem', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
        }}>
          Saved Rides
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {savedRides.map(ride => (
          <div key={ride.id} style={{
            background: '#fff',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-gold)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(201,169,110,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Raleway', sans-serif",
                fontWeight: 700, fontSize: '0.9rem',
                color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {ride.name}
              </div>
              <div style={{
                fontFamily: "'Raleway', sans-serif",
                fontSize: '0.72rem', color: 'var(--text-muted)',
                marginTop: '0.2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
              }}>
                <span>{formatDate(ride.createdAt)}</span>
                <span>·</span>
                <span>{ride.totalDistanceKm.toFixed(0)} km</span>
                <span>·</span>
                <span>{formatTime(ride.estimatedTotalTimeMin)}</span>
                <span>·</span>
                <span>{ride.intensity.toFixed(0)}% FTP</span>
                {ride.climbCount > 0 && <><span>·</span><span>⛰ {ride.climbCount}</span></>}
              </div>
            </div>
            <button
              onClick={() => loadRide(ride.id)}
              className="btn btn-ghost"
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.8rem', flexShrink: 0 }}
            >
              Load
            </button>
            <button
              onClick={() => deleteRide(ride.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0.2rem',
                flexShrink: 0,
                transition: 'color 0.15s',
              }}
              title="Delete ride"
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-danger)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
