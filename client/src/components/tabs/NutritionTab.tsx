import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { NutritionResult } from '../../types/analysis';

interface Props { data: NutritionResult; }

const sans = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const NutritionTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: '#fff',
      border: '2px solid #000',
      padding: '0.7rem 0.9rem',
      fontFamily: sans,
      fontSize: '0.78rem',
      lineHeight: 1.8,
    }}>
      <div style={{ color: '#000', fontWeight: 700, marginBottom: '0.15rem' }}>Hour {label}</div>
      <div style={{ color: '#000' }}>{d?.carbsG}g carbs</div>
      <div style={{ color: '#555' }}>{d?.fluidMl}ml fluid</div>
      <div style={{ color: '#555' }}>{d?.sodiumMg}mg sodium</div>
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

      {/* Per-hour targets — clean black grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 0,
        border: '2px solid #000',
      }}>
        {[
          { label: 'Carbs / hr',  value: `${carbsPerHour}g`                   },
          { label: 'Fluid / hr',  value: `${fluidPerHourMl}ml`                },
          { label: 'Sodium / hr', value: `${sodiumPerHourMg}mg`               },
          { label: 'Total Na',    value: `${totalSodiumMg.toLocaleString()}mg` },
        ].map(({ label, value }, i, arr) => (
          <div key={label} style={{
            padding: '0.875rem 1rem',
            borderRight: i < arr.length - 1 ? '1px solid #ccc' : 'none',
          }}>
            <div className="label" style={{ marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: '1.3rem', color: '#000' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Carbs bar chart */}
      <div className="card" style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
        <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, marginBottom: '0.2rem' }}>Carbs per Hour</div>
        <div style={{ fontFamily: sans, fontSize: '0.75rem', color: '#999', marginBottom: '1rem' }}>
          Hover for full breakdown · target {carbsPerHour}g/h
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={hourlyPlan} margin={{ top: 4, right: 10, bottom: 0, left: -10 }} barSize={22}>
            <CartesianGrid strokeDasharray="2 2" stroke="#ccc" vertical={false} />
            <XAxis dataKey="hour" stroke="#ccc" tick={{ fill: '#999', fontSize: 11, fontFamily: sans }}
              tickFormatter={v => `H${v}`} tickLine={false} axisLine={{ stroke: '#ccc' }} />
            <YAxis stroke="#ccc" tick={{ fill: '#999', fontSize: 11, fontFamily: sans }}
              tickFormatter={v => `${v}g`} tickLine={false} axisLine={false} />
            <Tooltip content={<NutritionTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="carbsG" radius={0}>
              {hourlyPlan.map((_, i) => (
                <Cell key={i} fill={i === hourlyPlan.length - 1 ? '#555' : '#000'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly food plan */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '0.875rem 1.25rem',
          borderBottom: '2px solid #000',
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontWeight: 700,
        }}>
          Hourly Food Plan
        </div>
        {hourlyPlan.map((slot, idx) => (
          <div key={slot.hour} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.7rem 1.25rem',
            borderBottom: idx < hourlyPlan.length - 1 ? '1px solid #e5e5e5' : 'none',
            flexWrap: 'wrap',
          }}>
            {/* Square hour marker */}
            <div style={{
              width: '30px', height: '30px',
              background: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: sans,
              fontWeight: 700, fontSize: '0.78rem', color: '#fff',
              flexShrink: 0,
            }}>
              {slot.hour}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flex: 1 }}>
              {slot.suggestions.map((s, i) => (
                <span key={i} style={{
                  background: '#f5f5f5',
                  border: '1px solid #ccc',
                  padding: '0.18rem 0.6rem',
                  fontFamily: sans,
                  fontSize: '0.78rem', color: '#000',
                }}>
                  {s}
                </span>
              ))}
            </div>
            <div style={{ fontFamily: sans, fontSize: '0.73rem', color: '#999', whiteSpace: 'nowrap' }}>
              {slot.carbsG}g · {slot.fluidMl}ml
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: sans, fontSize: '0.73rem', color: '#999' }}>
        Targets based on evidence-backed guidelines (60–90g carbs/h, 625ml fluid/h, 600mg sodium/h). Gut-train in training before race day.
      </div>
    </div>
  );
}
