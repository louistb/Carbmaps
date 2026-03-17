import React from 'react';
import { useAnalysisStore, TabId } from '../../store/analysisStore';

const ALL_TABS: { id: TabId; label: string }[] = [
  { id: 'pacing',    label: 'Pacing'    },
  { id: 'climbs',    label: 'Climbs'    },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'weather',   label: 'Weather'   },
];

export function TabBar() {
  const { activeTab, setActiveTab, result } = useAnalysisStore();
  const tabs = result?.weather ? ALL_TABS : ALL_TABS.filter(t => t.id !== 'weather');

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '2px solid #000',
      padding: '0 1.5rem',
      display: 'flex',
      gap: 0,
      overflowX: 'auto',
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: isActive ? '#000' : 'transparent',
              border: 'none',
              borderRight: '1px solid #ccc',
              color: isActive ? '#fff' : '#999',
              padding: '0.75rem 1.5rem',
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.1s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
