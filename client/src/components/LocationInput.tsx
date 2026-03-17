import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Suggestion {
  name: string;
  country: string;
  type: string;
  lat: number;
  lon: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '2px solid #000',
  padding: '0.65rem 1rem',
  color: '#000',
  fontSize: '0.9rem',
  outline: 'none',
};

export function LocationInput({ value, onChange, placeholder = 'e.g. Chamonix, France' }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) { setSuggestions([]); setOpen(false); return; }
      setLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`
        );
        const data = await res.json();
        const items: Suggestion[] = (data.features ?? []).map((f: any) => ({
          name:    f.properties.name ?? '',
          country: f.properties.country ?? '',
          type:    f.properties.type ?? '',
          lat:     f.geometry.coordinates[1],
          lon:     f.geometry.coordinates[0],
        })).filter((s: Suggestion) => s.name);
        setSuggestions(items);
        setOpen(items.length > 0);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    fetchSuggestions(e.target.value);
  };

  const select = (s: Suggestion) => {
    const label = [s.name, s.country].filter(Boolean).join(', ');
    onChange(label);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); select(suggestions[activeIdx]); }
    if (e.key === 'Escape') { setOpen(false); }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const typeIcon: Record<string, string> = {
    city: '🏙️', town: '🏘️', village: '🌄', locality: '📍',
    peak: '⛰️', mountain: '⛰️', district: '📍', country: '🌍',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={inputStyle}
          autoComplete="off"
        />
        {loading && (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: 'var(--text-muted)',
          }}>
            ⟳
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 2px)',
          left: 0, right: 0,
          background: '#ffffff',
          border: '1px solid var(--border-strong)',
          zIndex: 9999,
          overflow: 'hidden',
        }}>
          {suggestions.map((s, i) => {
            const icon = typeIcon[s.type] ?? '📍';
            const label = [s.name, s.country].filter(Boolean).join(', ');
            return (
              <div
                key={i}
                onMouseDown={() => select(s)}
                style={{
                  padding: '0.55rem 0.85rem',
                  cursor: 'pointer',
                  background: i === activeIdx ? 'var(--bg-elevated)' : 'transparent',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(-1)}
              >
                <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {s.type}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
