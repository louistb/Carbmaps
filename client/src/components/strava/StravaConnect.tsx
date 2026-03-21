import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStrava, StravaRoute } from '../../hooks/useStrava';

const STRAVA_ORANGE = '#FC4C02';

function fmtDist(m: number)  { return (m / 1000).toFixed(0) + ' km'; }
function fmtElev(m: number)  { return Math.round(m) + ' m↑'; }
function fmtTime(s: number)  {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

interface Props {
  onSelect:        (route: StravaRoute) => void;
  selectedRouteId: string | null;
}

export function StravaConnect({ onSelect, selectedRouteId }: Props) {
  const {
    connected, routes, loadingRoutes, athleteName,
    connect, disconnect, fetchRoutes,
  } = useStrava();

  const [open, setOpen] = useState(connected);

  useEffect(() => {
    if (open && connected && routes.length === 0) fetchRoutes();
  }, [open, connected]);

  return (
    <div style={{ marginBottom: '0.25rem' }}>

      {/* ── Not connected ── */}
      {!connected && (
        <button
          type="button"
          onClick={connect}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            background: STRAVA_ORANGE,
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <StravaLogo />
          <span style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.06em',
            color: '#fff',
          }}>
            Connect with Strava
          </span>
        </button>
      )}

      {/* ── Connected ── */}
      {connected && (
        <div style={{
          border: '1.5px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: '#fff',
          overflow: 'hidden',
        }}>
          {/* Header row */}
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1.125rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{ flexShrink: 0 }}><StravaLogo color={STRAVA_ORANGE} size={18} /></div>
              <span style={{
                fontFamily: "'Raleway', sans-serif",
                fontWeight: 700,
                fontSize: '0.88rem',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}>
                {athleteName ? `Strava · ${athleteName}` : 'Strava connected'}
              </span>
              <span style={{
                background: '#FEF0E8',
                color: STRAVA_ORANGE,
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '0.15rem 0.45rem',
                borderRadius: 4,
                flexShrink: 0,
              }}>connected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              <span
                onClick={e => { e.stopPropagation(); disconnect(); }}
                style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                disconnect
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                display: 'inline-block',
              }}>▾</span>
            </div>
          </button>

          {/* Route list */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 1.125rem',
                    background: 'var(--bg-elevated)',
                  }}>
                    <span style={{
                      fontFamily: "'Raleway', sans-serif",
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                    }}>
                      Saved routes
                    </span>
                    <button
                      type="button"
                      onClick={fetchRoutes}
                      disabled={loadingRoutes}
                      style={{
                        fontFamily: "'Raleway', sans-serif",
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.1rem 0.3rem',
                        opacity: loadingRoutes ? 0.5 : 1,
                      }}
                    >
                      {loadingRoutes ? 'Loading…' : '↻ Refresh'}
                    </button>
                  </div>

                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {loadingRoutes && routes.length === 0 && (
                      <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        fontFamily: "'Raleway', sans-serif",
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                      }}>
                        Fetching your routes…
                      </div>
                    )}
                    {!loadingRoutes && routes.length === 0 && (
                      <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        fontFamily: "'Raleway', sans-serif",
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                      }}>
                        No saved cycling routes found.{' '}
                        <a
                          href="https://www.strava.com/routes/new"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: STRAVA_ORANGE }}
                        >
                          Create one on Strava →
                        </a>
                      </div>
                    )}
                    {routes.map((r, i) => (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 1.125rem',
                          borderTop: i > 0 ? '1px solid var(--border-subtle)' : undefined,
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: "'Raleway', sans-serif",
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {r.name}
                          </div>
                          <div style={{
                            fontFamily: "'Raleway', sans-serif",
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            marginTop: 2,
                            display: 'flex',
                            gap: '0.6rem',
                            flexWrap: 'wrap',
                          }}>
                            <span>{fmtDist(r.distance)}</span>
                            <span>·</span>
                            <span>{fmtElev(r.elevation_gain)}</span>
                            <span>·</span>
                            <span>~{fmtTime(r.estimated_moving_time)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelect(r)}
                          style={{
                            fontFamily: "'Raleway', sans-serif",
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            color: selectedRouteId === r.id ? '#fff' : STRAVA_ORANGE,
                            background: selectedRouteId === r.id ? STRAVA_ORANGE : 'none',
                            border: `1.5px solid ${STRAVA_ORANGE}`,
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.3rem 0.7rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s',
                          }}
                        >
                          {selectedRouteId === r.id ? '✓ Selected' : 'Select route'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function StravaLogo({ color = '#fff', size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  );
}
