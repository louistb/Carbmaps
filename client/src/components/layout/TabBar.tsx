import React from 'react';
import { useAnalysisStore, TabId } from '../../store/analysisStore';

const ALL_TABS: { id: TabId; label: string; color: string }[] = [
  { id: 'pacing',    label: '🚴 Pacing',    color: '#e8521e' },
  { id: 'climbs',    label: '⛰️ Climbs',    color: '#65a30d' },
  { id: 'nutrition', label: '🍌 Nutrition', color: '#d97706' },
  { id: 'weather',   label: '🌤️ Weather',   color: '#0284c7' },
];

export function TabBar() {
  const { activeTab, setActiveTab, result } = useAnalysisStore();
  const tabs = result?.weather ? ALL_TABS : ALL_TABS.filter(t => t.id !== 'weather');

  return (
    <nav style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
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
              background: 'none',
              border: 'none',
              borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
              color: isActive ? tab.color : 'var(--text-secondary)',
              padding: '0.8rem 1.2rem',
              fontSize: '0.855rem',
              fontWeight: isActive ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.14s ease',
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
