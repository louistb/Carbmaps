import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { NutritionResult, MapPoint } from '../../types/analysis';
import { NutritionMap } from '../RouteMap';

interface Props { data: NutritionResult; routePoints: MapPoint[]; }

const ral = "'Raleway', sans-serif";

const NutritionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      padding: '0.7rem 0.9rem',
      fontFamily: ral,
      fontSize: '0.78rem',
      lineHeight: 1.8,
      boxShadow: '0 4px 16px rgba(26,26,24,0.1)',
    }}>
      <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.15rem' }}>Hour {label}</div>
      <div style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{d?.carbsG}g carbs</div>
      <div style={{ color: 'var(--text-muted)' }}>{d?.fluidMl}ml fluid</div>
      <div style={{ color: 'var(--text-muted)' }}>{d?.sodiumMg}mg sodium</div>
    </div>
  );
};

export function NutritionTab({ data, routePoints }: Props) {
  const [showMap, setShowMap]         = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);
  const {
    totalKcal, totalCarbsG, totalFluidMl, totalSodiumMg,
    carbsPerHour, fluidPerHourMl, sodiumPerHourMg,
    hourlyPlan, estimatedDurationHours,
  } = data;

  return (
    <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-base)' }}>

      {/* Big totals */}
      <div className="stats-grid">
        {[
          { label: 'Total Calories', value: `${totalKcal.toLocaleString()} kcal` },
          { label: 'Total Carbs',    value: `${totalCarbsG}g` },
          { label: 'Total Fluid',    value: `${(totalFluidMl / 1000).toFixed(1)}L` },
          { label: 'Est. Duration',  value: `${estimatedDurationHours.toFixed(1)}h` },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card">
            <span className="label">{label}</span>
            <span className="value-large">{value}</span>
          </div>
        ))}
      </div>

      {/* Per-hour targets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '1px',
        background: 'var(--border-subtle)',
        border: '1.5px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        {[
          { label: 'Carbs / hr',  value: `${carbsPerHour}g`                   },
          { label: 'Fluid / hr',  value: `${fluidPerHourMl}ml`                },
          { label: 'Sodium / hr', value: `${sodiumPerHourMg}mg`               },
          { label: 'Total Na',    value: `${totalSodiumMg.toLocaleString()}mg` },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: '0.875rem 1rem', background: '#fff' }}>
            <div className="label" style={{ marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontFamily: ral, fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Carbs bar chart */}
      <div className="card" style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
        <div style={{ fontFamily: ral, fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>Carbs per Hour</div>
        <div style={{ fontFamily: ral, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Hover for full breakdown · target {carbsPerHour}g/h
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={hourlyPlan} margin={{ top: 4, right: 10, bottom: 0, left: -10 }} barSize={22}>
            <CartesianGrid strokeDasharray="2 2" stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="hour" stroke="var(--border-subtle)" tick={{ fill: '#A8998C', fontSize: 11, fontFamily: ral }}
              tickFormatter={v => `H${v}`} tickLine={false} axisLine={{ stroke: 'var(--border-subtle)' }} />
            <YAxis stroke="var(--border-subtle)" tick={{ fill: '#A8998C', fontSize: 11, fontFamily: ral }}
              tickFormatter={v => `${v}g`} tickLine={false} axisLine={false} />
            <Tooltip content={<NutritionTooltip />} cursor={{ fill: 'rgba(201,169,110,0.08)' }} />
            <Bar dataKey="carbsG" radius={[2, 2, 0, 0]}>
              {hourlyPlan.map((_, i) => (
                <Cell key={i} fill={i === hourlyPlan.length - 1 ? '#C8B89A' : '#C9A96E'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly food plan */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '0.875rem 1.25rem',
          borderBottom: '1.5px solid var(--border-subtle)',
          fontFamily: ral,
          fontWeight: 800,
          fontSize: '0.95rem',
          color: 'var(--text-primary)',
          background: 'var(--bg-elevated)',
        }}>
          Hourly Food Plan
        </div>
        {(showAllHours || hourlyPlan.length <= 7 ? hourlyPlan : hourlyPlan.slice(0, 7)).map((slot, idx, arr) => (
          <div key={slot.hour} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '0.75rem 1.25rem',
            borderBottom: idx < arr.length - 1 || (!showAllHours && hourlyPlan.length > 7) ? '1px solid var(--border-subtle)' : 'none',
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: '30px', height: '30px',
              background: 'var(--accent-gold)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: ral, fontWeight: 800, fontSize: '0.78rem', color: '#fff',
              flexShrink: 0,
            }}>
              {slot.hour}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flex: 1 }}>
              {slot.suggestions.map((s, i) => (
                <span key={i} style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.2rem 0.6rem',
                  fontFamily: ral, fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500,
                }}>
                  {s}
                </span>
              ))}
            </div>
            <div style={{ fontFamily: ral, fontSize: '0.73rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontWeight: 500 }}>
              {slot.carbsG}g · {slot.fluidMl}ml
            </div>
          </div>
        ))}
        {hourlyPlan.length > 7 && (
          <button
            onClick={() => setShowAllHours(v => !v)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'var(--bg-elevated)',
              border: 'none',
              borderTop: showAllHours ? '1px solid var(--border-subtle)' : 'none',
              fontFamily: ral,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--accent-gold)',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {showAllHours
              ? `↑ Show less`
              : `↓ Show ${hourlyPlan.length - 7} more hour${hourlyPlan.length - 7 !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Carb vendors */}
      {!showMap ? (
        <button
          onClick={() => setShowMap(true)}
          className="btn btn-ghost"
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '0.8rem',
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
          }}
        >
          <span style={{ fontSize: '1rem' }}>🍽️</span>
          Find carb vendors on my route
        </button>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '0.875rem 1.25rem',
            borderBottom: '1.5px solid var(--border-subtle)',
            fontFamily: ral, fontWeight: 800, fontSize: '0.95rem',
            color: 'var(--text-primary)', background: 'var(--bg-elevated)',
          }}>
            Restaurants &amp; Cafés Near Route
          </div>
          <div style={{ padding: '1rem 1.25rem' }}>
            <NutritionMap points={routePoints} autoSearch />
          </div>
        </div>
      )}

      <div style={{ fontFamily: ral, fontSize: '0.73rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Targets based on evidence-backed guidelines (60–90g carbs/h, 625ml fluid/h, 600mg sodium/h). Gut-train in training before race day.
      </div>
    </div>
  );
}
