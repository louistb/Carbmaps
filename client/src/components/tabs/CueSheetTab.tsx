import React from 'react';
import { PacingResult, ClimbsResult, NutritionResult, MapPoint } from '../../types/analysis';

interface Props {
  pacing:      PacingResult;
  climbs:      ClimbsResult;
  nutrition:   NutritionResult;
  routePoints: MapPoint[];
}

const ral = "'Raleway', sans-serif";

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
}

// ── Generate self-contained HTML for the print window ─────────────────────────

function buildPrintHTML(
  pacing: PacingResult,
  climbs: ClimbsResult,
  nutrition: NutritionResult,
  routePoints: MapPoint[],
): string {
  const totalKm  = routePoints.length ? routePoints[routePoints.length - 1].distanceKm : 0;
  const ftpW     = pacing.segments.length
    ? Math.round(pacing.segments[0].targetPowerW / (pacing.segments[0].targetPowerPct / 100))
    : 0;
  const topClimbs = climbs.climbs.slice(0, 4);
  const hours     = nutrition.hourlyPlan.slice(0, 6);

  const headerStats = [
    { label: 'Zone', value: pacing.targetZoneLabel },
    { label: 'Dist', value: totalKm > 0 ? `${totalKm.toFixed(0)}km` : '—' },
    { label: 'Time', value: formatTime(pacing.estimatedTotalTimeMin) },
    { label: 'NP',   value: `${pacing.normalizedPowerW}W` },
    { label: 'TSS',  value: String(pacing.tss) },
    { label: 'IF',   value: pacing.intensityFactor.toFixed(2) },
  ];

  const climbsHTML = topClimbs.map((c, i) => `
    <div class="row">
      <span class="num">${i + 1}.</span>
      <span class="name">${c.name}</span>
      <span class="meta">${c.avgGradientPct.toFixed(1)}% · ${c.lengthKm.toFixed(1)}km</span>
      <span class="watts">${c.suggestedPowerW}W</span>
      <span class="pct">${c.suggestedPowerPct.toFixed(0)}%</span>
    </div>`).join('');

  const extraClimbs = climbs.climbs.length > 4
    ? `<div class="extra">+${climbs.climbs.length - 4} more climbs</div>` : '';

  const hoursHTML = hours.map(slot => `
    <div class="row">
      <span class="badge">H${slot.hour}</span>
      <span class="suggestions">${slot.suggestions.slice(0, 3).join(' · ')}</span>
      <span class="g">${slot.carbsG}g</span>
    </div>`).join('');

  const extraHours = nutrition.hourlyPlan.length > 6
    ? `<div class="extra">+${nutrition.hourlyPlan.length - 6} more hours</div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&family=MedievalSharp&display=swap" rel="stylesheet"/>
  <style>
    @page { margin: 0.5in; }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      width: 4in;
      height: 2in;
      overflow: hidden;
      font-family: 'Raleway', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background: #fff;
    }

    .card {
      width: 4in;
      height: 2in;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* ── Header ── */
    .header {
      background: #1A1A18;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2.5pt 6pt;
      flex-shrink: 0;
      gap: 4pt;
    }
    .logo {
      font-family: 'MedievalSharp', cursive;
      font-size: 9pt;
      color: #C9A96E;
      letter-spacing: 0.05em;
      line-height: 1;
      flex-shrink: 0;
    }
    .stats {
      display: flex;
      gap: 8pt;
      align-items: center;
    }
    .stat { text-align: center; line-height: 1.25; }
    .stat-label { font-size: 3.5pt; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; display: block; }
    .stat-value { font-size: 5.5pt; color: #fff; font-weight: 800; display: block; }

    /* ── Body ── */
    .body {
      display: grid;
      grid-template-columns: ${topClimbs.length > 0 ? '1fr 1fr' : '1fr'};
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* ── Columns ── */
    .col {
      padding: 3pt 5pt 2pt;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .col-climbs { border-right: 0.5pt solid #E0D6C8; }

    .col-header {
      font-size: 4.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #A8998C;
      border-bottom: 0.3pt solid #E0D6C8;
      padding-bottom: 1.5pt;
      margin-bottom: 2pt;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .col-header-right { font-size: 4.5pt; font-weight: 600; color: #6B5E52; text-transform: none; letter-spacing: 0; }

    /* ── Rows ── */
    .rows { display: flex; flex-direction: column; gap: 2pt; }
    .row { display: flex; align-items: baseline; gap: 3pt; font-size: 5.5pt; line-height: 1.3; overflow: hidden; }

    /* Climbs row */
    .num   { font-size: 5pt; font-weight: 800; color: #C9A96E; flex-shrink: 0; width: 6pt; }
    .name  { font-size: 5.5pt; font-weight: 700; color: #1A1A18; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta  { font-size: 4.5pt; color: #6B5E52; white-space: nowrap; flex-shrink: 0; }
    .watts { font-size: 6pt; font-weight: 800; color: #1A1A18; white-space: nowrap; flex-shrink: 0; }
    .pct   { font-size: 4.5pt; color: #A8998C; white-space: nowrap; flex-shrink: 0; }

    /* Fueling row */
    .badge { font-size: 4.5pt; font-weight: 800; color: #fff; background: #C9A96E; padding: 0.5pt 2.5pt; border-radius: 1pt; flex-shrink: 0; line-height: 1.5; }
    .suggestions { font-size: 5pt; color: #1A1A18; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .g { font-size: 5pt; font-weight: 700; color: #A8998C; flex-shrink: 0; }

    .extra { font-size: 4pt; color: #A8998C; font-style: italic; margin-top: 1.5pt; }

    /* ── Footer ── */
    .footer {
      background: #F4EDE3;
      border-top: 0.3pt solid #E0D6C8;
      padding: 1.5pt 5pt;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .footer span { font-size: 4pt; color: #A8998C; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="logo">CarbMaps</span>
      <div class="stats">
        ${headerStats.map(s => `
          <div class="stat">
            <span class="stat-label">${s.label}</span>
            <span class="stat-value">${s.value}</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="body">
      ${topClimbs.length > 0 ? `
      <div class="col col-climbs">
        <div class="col-header">Key Climbs</div>
        <div class="rows">${climbsHTML}${extraClimbs}</div>
      </div>` : ''}

      <div class="col col-fueling">
        <div class="col-header">
          Fueling
          <span class="col-header-right">${nutrition.carbsPerHour}g/h · ${nutrition.fluidPerHourMl}ml/h</span>
        </div>
        <div class="rows">${hoursHTML}${extraHours}</div>
      </div>
    </div>

    <div class="footer">
      <span>FTP ${ftpW}W · ${pacing.targetZonePctLow}–${pacing.targetZonePctHigh}% target zone</span>
      <span>carbmaps.fit</span>
    </div>
  </div>
  <script>
    // Wait for fonts then print
    document.fonts.ready.then(() => {
      window.print();
      window.close();
    });
  </script>
</body>
</html>`;
}

// ── Preview card (screen only, scales to container) ───────────────────────────

function PreviewCard({ pacing, climbs, nutrition, routePoints }: Props) {
  const totalKm  = routePoints.length ? routePoints[routePoints.length - 1].distanceKm : 0;
  const ftpW     = pacing.segments.length
    ? Math.round(pacing.segments[0].targetPowerW / (pacing.segments[0].targetPowerPct / 100))
    : 0;
  const topClimbs = climbs.climbs.slice(0, 4);
  const hours     = nutrition.hourlyPlan.slice(0, 6);

  const s = (n: number) => n * 2.8; // scale pt → px for preview

  return (
    <div style={{ width: '100%', maxWidth: 720, background: '#fff', fontFamily: ral, border: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(26,26,24,0.12)' }}>

      {/* Header */}
      <div style={{ background: '#1A1A18', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${s(2.5)}px ${s(6)}px`, gap: s(4) }}>
        <span style={{ fontFamily: "'MedievalSharp', cursive", fontSize: s(9), color: '#C9A96E', letterSpacing: '0.05em', lineHeight: 1, flexShrink: 0 }}>CarbMaps</span>
        <div style={{ display: 'flex', gap: s(8), alignItems: 'center' }}>
          {[
            { label: 'Zone', value: pacing.targetZoneLabel },
            { label: 'Dist', value: totalKm > 0 ? `${totalKm.toFixed(0)}km` : '—' },
            { label: 'Time', value: formatTime(pacing.estimatedTotalTimeMin) },
            { label: 'NP',   value: `${pacing.normalizedPowerW}W` },
            { label: 'TSS',  value: String(pacing.tss) },
            { label: 'IF',   value: pacing.intensityFactor.toFixed(2) },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', lineHeight: 1.25 }}>
              <div style={{ fontSize: s(3.5), color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              <div style={{ fontSize: s(5.5), color: '#fff', fontWeight: 800 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: topClimbs.length > 0 ? '1fr 1fr' : '1fr', flex: 1 }}>

        {topClimbs.length > 0 && (
          <div style={{ borderRight: '1px solid #E0D6C8', padding: `${s(3)}px ${s(5)}px ${s(2)}px` }}>
            <div style={{ fontSize: s(4.5), fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A8998C', borderBottom: '1px solid #E0D6C8', paddingBottom: s(1.5), marginBottom: s(2) }}>Key Climbs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: s(2) }}>
              {topClimbs.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: s(3), flexWrap: 'nowrap', overflow: 'hidden' }}>
                  <span style={{ fontSize: s(5), fontWeight: 800, color: '#C9A96E', flexShrink: 0, width: s(6) }}>{i + 1}.</span>
                  <span style={{ fontSize: s(5.5), fontWeight: 700, color: '#1A1A18', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                  <span style={{ fontSize: s(4.5), color: '#6B5E52', whiteSpace: 'nowrap' }}>{c.avgGradientPct.toFixed(1)}% · {c.lengthKm.toFixed(1)}km</span>
                  <span style={{ fontSize: s(6), fontWeight: 800, color: '#1A1A18', whiteSpace: 'nowrap' }}>{c.suggestedPowerW}W</span>
                  <span style={{ fontSize: s(4.5), color: '#A8998C', whiteSpace: 'nowrap' }}>{c.suggestedPowerPct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
            {climbs.climbs.length > 4 && <div style={{ fontSize: s(4), color: '#A8998C', fontStyle: 'italic', marginTop: s(1.5) }}>+{climbs.climbs.length - 4} more climbs</div>}
          </div>
        )}

        <div style={{ padding: `${s(3)}px ${s(5)}px ${s(2)}px` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: s(4.5), fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#A8998C', borderBottom: '1px solid #E0D6C8', paddingBottom: s(1.5), marginBottom: s(2) }}>
            <span>Fueling</span>
            <span style={{ fontSize: s(4.5), fontWeight: 600, color: '#6B5E52', textTransform: 'none', letterSpacing: 0 }}>{nutrition.carbsPerHour}g/h · {nutrition.fluidPerHourMl}ml/h</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: s(2) }}>
            {hours.map(slot => (
              <div key={slot.hour} style={{ display: 'flex', alignItems: 'baseline', gap: s(3) }}>
                <span style={{ fontSize: s(4.5), fontWeight: 800, color: '#fff', background: '#C9A96E', padding: `${s(0.5)}px ${s(2.5)}px`, borderRadius: 2, flexShrink: 0, lineHeight: 1.5 }}>H{slot.hour}</span>
                <span style={{ fontSize: s(5), color: '#1A1A18', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.suggestions.slice(0, 3).join(' · ')}</span>
                <span style={{ fontSize: s(5), fontWeight: 700, color: '#A8998C', flexShrink: 0 }}>{slot.carbsG}g</span>
              </div>
            ))}
            {nutrition.hourlyPlan.length > 6 && <div style={{ fontSize: s(4), color: '#A8998C', fontStyle: 'italic' }}>+{nutrition.hourlyPlan.length - 6} more hours</div>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#F4EDE3', borderTop: '1px solid #E0D6C8', padding: `${s(1.5)}px ${s(5)}px`, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: s(4), color: '#A8998C' }}>FTP {ftpW}W · {pacing.targetZonePctLow}–{pacing.targetZonePctHigh}% target zone</span>
        <span style={{ fontSize: s(4), color: '#A8998C' }}>carbmaps.fit</span>
      </div>
    </div>
  );
}

// ── Tab wrapper ────────────────────────────────────────────────────────────────

export function CueSheetTab({ pacing, climbs, nutrition, routePoints }: Props) {

  const handlePrint = () => {
    const html = buildPrintHTML(pacing, climbs, nutrition, routePoints);
    const win = window.open('', '_blank', 'width=500,height=300');
    if (!win) { alert('Allow pop-ups to print the cue sheet.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-base)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: ral, fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Cue Sheet
          </h2>
          <p style={{ fontFamily: ral, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            4 × 2 inch printable card — stick it on your stem or top-tube bag
          </p>
        </div>
        <button onClick={handlePrint} className="btn btn-primary"
          style={{ fontSize: '0.78rem', padding: '0.65rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>⎙</span> Print Card
        </button>
      </div>

      {/* Preview */}
      <div style={{ background: '#fff', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 4px rgba(26,26,24,0.06)' }}>
        <div style={{ fontFamily: ral, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Preview — actual card is 4 × 2 inches
        </div>
        <PreviewCard pacing={pacing} climbs={climbs} nutrition={nutrition} routePoints={routePoints} />
      </div>

      {/* Tips */}
      <div style={{ border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', background: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontFamily: ral, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          Print tips
        </div>
        {[
          'A pop-up window will open — your browser will prompt to print it at 4 × 2 inches automatically',
          'Use cardstock or laminate for durability on the bike',
          'Fold and tuck into your top-tube bag or tape to your stem',
          'Powers shown are targets — adjust based on how you feel on the day',
        ].map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontFamily: ral, fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-gold)', flexShrink: 0, marginTop: 2 }}>→</span>
            <span style={{ fontFamily: ral, fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.5 }}>{tip}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
