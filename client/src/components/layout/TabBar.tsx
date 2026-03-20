import React from 'react';
import { useAnalysisStore, TabId } from '../../store/analysisStore';

const ALL_TABS: { id: TabId; label: string }[] = [
  { id: 'pacing',    label: 'Pacing'    },
  { id: 'climbs',    label: 'Climbs'    },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'weather',   label: 'Weather'   },
  { id: 'cuesheet',  label: 'Cue Sheet' },
];

export function TabBar() {
  const { activeTab, setActiveTab, result } = useAnalysisStore();
  const tabs = ALL_TABS.filter(t => t.id !== 'weather' || !!result?.weather);

  return (
    <nav className="tab-bar" style={{
      background: '#fff',
      borderBottom: '1.5px solid var(--border-subtle)',
      padding: '0 1rem',
      display: 'flex',
      gap: 0,
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className="tab-bar-btn"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2.5px solid var(--accent-gold)' : '2.5px solid transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
              padding: '0.85rem 1.1rem',
              fontFamily: "'Raleway', sans-serif",
              fontSize: '0.72rem',
              fontWeight: isActive ? 800 : 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
              marginBottom: '-1.5px',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
