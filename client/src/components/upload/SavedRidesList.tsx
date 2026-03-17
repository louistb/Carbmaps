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
    <div style={{ width: '100%', maxWidth: '560px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginBottom: '0.75rem',
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Saved Rides
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {savedRides.map(ride => (
          <div key={ride.id} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ride.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
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
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem', flexShrink: 0 }}
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
