import { useMemo, useState } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { SearchBox } from './SearchBox';
import { Slider } from './Slider';
import { Toggle } from './Toggle';
import { RelationshipFilters } from './RelationshipFilters';
import type { RelationshipType } from '../data/types';
import './MinimalPanel.css';

const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

interface MinimalPanelProps {
  onBackToLanding?: () => void;
}

export function MinimalPanel({ onBackToLanding }: MinimalPanelProps) {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 640);
  const { dataset, filters, updateFilters, attributeFilters, setAttributeFilters, resetAttributeFilters, isDarkMode, toggleDarkMode } = useGraphStore();

  const handleLayoutChange = (mode: 'dag' | 'force' | 'cluster' | 'timeline') => {
    updateFilters({ layoutMode: mode });
  };

  const handleGraphModeChange = (mode: 'implementation' | 'influence') => {
    updateFilters({
      graphMode: mode,
      ...(mode === 'influence' ? { layoutMode: 'force' } : {}),
    });
  };

  const handleRelationshipFilter = (relationship: RelationshipType, enabled: boolean) => {
    updateFilters({
      relationshipFilters: {
        ...filters.relationshipFilters,
        [relationship]: enabled,
      },
    });
  };

  const uniqueParadigms = useMemo(() => {
    if (!dataset) return [];
    const set = new Set<string>();
    dataset.languages.forEach((l) => l.paradigm?.forEach((p) => set.add(p)));
    return [...set].sort();
  }, [dataset]);

  const uniqueTyping = useMemo(() => {
    if (!dataset) return [];
    const set = new Set<string>();
    dataset.languages.forEach((l) => { if (l.typing) set.add(l.typing); });
    return [...set].sort();
  }, [dataset]);

  const hasActiveFilters = attributeFilters.paradigms.length > 0 || attributeFilters.typing !== null || attributeFilters.decade !== null;

  const toggleParadigm = (p: string) => {
    const current = attributeFilters.paradigms;
    if (current.includes(p)) {
      setAttributeFilters({ paradigms: current.filter((x) => x !== p) });
    } else {
      setAttributeFilters({ paradigms: [...current, p] });
    }
  };

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-inner">
          <header className="panel-header">
            <div className="panel-brand">
              <span className="panel-logo-mark">LL</span>
              <div className="panel-brand-text">
                <span className="panel-title">Language Lineage</span>
                <span className="panel-subtitle">
                  {filters.graphMode === 'influence' ? 'What inspired what' : 'What built what'}
                </span>
              </div>
            </div>
            <div className="panel-header-actions">
              <button
                className="icon-btn"
                onClick={toggleDarkMode}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? '☀' : '☾'}
              </button>
              {onBackToLanding && (
                <button className="icon-btn" onClick={onBackToLanding} title="Back to home">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 12h18M3 6l6 6-6 6"/>
                  </svg>
                </button>
              )}
            </div>
          </header>

          <section className="panel-section mode-toggle-section">
            <div className="graph-mode-toggle">
              <button
                className={filters.graphMode === 'implementation' ? 'active' : ''}
                onClick={() => handleGraphModeChange('implementation')}
              >
                <span className="mode-label">Implementation</span>
                <span className="mode-sublabel">What built what</span>
              </button>
              <button
                className={filters.graphMode === 'influence' ? 'active' : ''}
                onClick={() => handleGraphModeChange('influence')}
              >
                <span className="mode-label">Influence</span>
                <span className="mode-sublabel">What inspired what</span>
              </button>
            </div>
          </section>

          <section className="panel-section">
            <h3>Layout</h3>
            <div className="layout-toggle">
              <button className={filters.layoutMode === 'force' ? 'active' : ''} onClick={() => handleLayoutChange('force')}>Network</button>
              <button className={filters.layoutMode === 'dag' ? 'active' : ''} onClick={() => handleLayoutChange('dag')}>Tree</button>
              <button className={filters.layoutMode === 'cluster' ? 'active' : ''} onClick={() => handleLayoutChange('cluster')}>Cluster</button>
              <button className={filters.layoutMode === 'timeline' ? 'active' : ''} onClick={() => handleLayoutChange('timeline')}>Timeline</button>
            </div>
          </section>

          <section className="panel-section">
            <h3>Search</h3>
            <SearchBox
              value={filters.searchQuery}
              onChange={(value) => updateFilters({ searchQuery: value })}
              placeholder="Search languages..."
            />
          </section>

          <section className="panel-section">
            <Slider
              label="Confidence Threshold"
              value={filters.confidenceThreshold}
              min={0}
              max={1}
              step={0.05}
              onChange={(value) => updateFilters({ confidenceThreshold: value })}
            />
          </section>

          {filters.graphMode === 'influence' ? (
            <section className="panel-section">
              <div className="influence-mode-note">
                Showing 189 documented conceptual influence relationships between languages.
              </div>
            </section>
          ) : (
            <section className="panel-section">
              <RelationshipFilters
                filters={filters.relationshipFilters}
                onChange={handleRelationshipFilter}
              />
            </section>
          )}

          <section className="panel-section">
            <h3>Display Options</h3>
            <Toggle label="Show Self-Loops" checked={filters.showSelfLoops} onChange={(checked) => updateFilters({ showSelfLoops: checked })} />
            <Toggle label="Cluster Coloring" checked={filters.clusterColoring} onChange={(checked) => updateFilters({ clusterColoring: checked })} />
            <Toggle label="Show All Labels" checked={filters.showAllLabels} onChange={(checked) => updateFilters({ showAllLabels: checked })} />
          </section>

          <section className="panel-section">
            <h3>
              Attribute Filters
              {hasActiveFilters && (
                <button className="clear-filters-btn" onClick={resetAttributeFilters}>Clear</button>
              )}
            </h3>

            <div className="filter-group">
              <label className="filter-group-label">Paradigm</label>
              <div className="filter-chips">
                {uniqueParadigms.map((p) => (
                  <button
                    key={p}
                    className={`filter-chip ${attributeFilters.paradigms.includes(p) ? 'active' : ''}`}
                    onClick={() => toggleParadigm(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-group-label">Typing</label>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${attributeFilters.typing === null ? 'active' : ''}`}
                  onClick={() => setAttributeFilters({ typing: null })}
                >
                  All
                </button>
                {uniqueTyping.map((t) => (
                  <button
                    key={t}
                    className={`filter-chip ${attributeFilters.typing === t ? 'active' : ''}`}
                    onClick={() => setAttributeFilters({ typing: attributeFilters.typing === t ? null : t })}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-group-label">Decade</label>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${attributeFilters.decade === null ? 'active' : ''}`}
                  onClick={() => setAttributeFilters({ decade: null })}
                >
                  All
                </button>
                {DECADES.map((d) => (
                  <button
                    key={d}
                    className={`filter-chip ${attributeFilters.decade === d ? 'active' : ''}`}
                    onClick={() => setAttributeFilters({ decade: attributeFilters.decade === d ? null : d })}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </aside>

      {!collapsed && (
        <div className="sidebar-backdrop" onClick={() => setCollapsed(true)} />
      )}

      <button
        className={`sidebar-toggle-tab ${collapsed ? 'collapsed' : ''}`}
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Open panel' : 'Close panel'}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease' }}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </>
  );
}
