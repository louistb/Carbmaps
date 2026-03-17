import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { NutritionResult } from '../../types/analysis';

interface Props { data: NutritionResult; }

const NutritionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e5e0d8',
      borderRadius: '10px', padding: '0.7rem 0.9rem', fontSize: '0.82rem', lineHeight: 1.8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    }}>
      <div style={{ color: '#6b6560', fontWeight: 700, marginBottom: '0.15rem' }}>Hour {label}</div>
      <div style={{ color: '#d97706' }}>🍌 {d?.carbsG}g carbs</div>
      <div style={{ color: '#0284c7' }}>💧 {d?.fluidMl}ml fluid</div>
      <div style={{ color: '#16a34a' }}>🧂 {d?.sodiumMg}mg sodium</div>
    </div>
  );
};

export function NutritionTab({ data }: Props) {
  const {
    totalKcal, totalCarbsG, totalFluidMl, totalSodiumMg,
    carbsPerHour, fluidPerHourMl, sodiumPerHourMg,
    hourlyPlan, estimatedDurationHours,
  } = data;

  return (
    <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Big totals */}
      <div className="stats-grid">
        {[
          { label: 'Total Calories', value: `${totalKcal.toLocaleString()} kcal`, accent: true },
          { label: 'Total Carbs',    value: `${totalCarbsG}g` },
          { label: 'Total Fluid',    value: `${(totalFluidMl / 1000).toFixed(1)}L` },
          { label: 'Est. Duration',  value: `${estimatedDurationHours.toFixed(1)}h` },
        ].map(({ label, value, accent }) => (
          <div key={label} className="stat-card">
            <span className="label">{label}</span>
            <span className="value-large" style={accent ? { color: 'var(--accent-primary)' } : {}}>{value}</span>
          </div>
        ))}
      </div>

      {/* Per-hour targets */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Carbs / hr',  value: `${carbsPerHour}g`,                        color: '#d97706' },
          { label: 'Fluid / hr',  value: `${fluidPerHourMl}ml`,                     color: '#0284c7' },
          { label: 'Sodium / hr', value: `${sodiumPerHourMg}mg`,                    color: '#16a34a' },
          { label: 'Total Na',    value: `${totalSodiumMg.toLocaleString()}mg`,      color: '#16a34a' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: '1 1 120px',
            background: 'var(--bg-elevated)',
            border: `1px solid ${color}22`,
            borderTop: `3px solid ${color}`,
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem 1rem',
          }}>
            <div className="label" style={{ marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Carbs bar chart */}
      <div className="card" style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
        <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Carbs per Hour</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Hover for full breakdown · target {carbsPerHour}g/h
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={hourlyPlan} margin={{ top: 4, right: 10, bottom: 0, left: -10 }} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" vertical={false} />
            <XAxis dataKey="hour" stroke="#d4cfc7" tick={{ fill: '#6b6560', fontSize: 11 }}
              tickFormatter={v => `H${v}`} tickLine={false} axisLine={{ stroke: '#e5e0d8' }} />
            <YAxis stroke="#d4cfc7" tick={{ fill: '#6b6560', fontSize: 11 }}
              tickFormatter={v => `${v}g`} tickLine={false} axisLine={false} />
            <Tooltip content={<NutritionTooltip />} cursor={{ fill: 'rgba(217,119,6,0.05)' }} />
            <Bar dataKey="carbsG" radius={[4, 4, 0, 0]}>
              {hourlyPlan.map((_, i) => (
                <Cell key={i} fill={i === hourlyPlan.length - 1 ? '#e8521e' : '#d97706'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly food suggestions */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700 }}>
          Hourly Food Plan
        </div>
        {hourlyPlan.map((slot, idx) => (
          <div key={slot.hour} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.7rem 1.25rem',
            borderBottom: idx < hourlyPlan.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            flexWrap: 'wrap',
          }}>
            <div style={{
              minWidth: '34px', height: '34px', borderRadius: '50%',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.82rem', color: 'var(--accent-primary)',
              flexShrink: 0,
            }}>
              {slot.hour}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
              {slot.suggestions.map((s, i) => (
                <span key={i} style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)', padding: '0.18rem 0.6rem',
                  fontSize: '0.78rem', color: 'var(--text-primary)',
                }}>
                  {s}
                </span>
              ))}
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {slot.carbsG}g · {slot.fluidMl}ml
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
        💡 Targets based on evidence-backed guidelines (60–90g carbs/h, 625ml fluid/h, 600mg sodium/h). Gut-train in training before race day.
      </div>
    </div>
  );
}
