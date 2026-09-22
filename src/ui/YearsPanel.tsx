import { useState, useMemo } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import { activateFocusMode } from '../graph/selectors';
import './YearsPanel.css';

type SortMode = 'year_asc' | 'name_asc';

interface LanguageYearItem {
  id: string;
  name: string;
  year: number | null;
  displayYear: string;
}

export function YearsPanel() {
  const { cy, dataset, filters } = useGraphStore();
  const [sortMode, setSortMode] = useState<SortMode>('year_asc');

  // Compute visible languages based on current filters
  const visibleLanguages = useMemo(() => {
    if (!cy || !dataset) return [];

    // Get visible node IDs from Cytoscape (already filtered by buildCytoscapeElements)
    const visibleNodeIds = new Set<string>();
    cy.nodes().forEach(node => {
      visibleNodeIds.add(node.id());
    });

    // Build list with years
    const items: LanguageYearItem[] = [];
    for (const nodeId of visibleNodeIds) {
      const lang = dataset.languageMap.get(nodeId);
      if (!lang) continue;

      const year = lang.first_release_year;
      items.push({
        id: lang.id,
        name: lang.name,
        year: year && year > 0 ? year : null,
        displayYear: year && year > 0 ? year.toString() : 'unknown',
      });
    }

    // Sort
    if (sortMode === 'year_asc') {
      items.sort((a, b) => {
        if (a.year === null && b.year === null) return a.name.localeCompare(b.name);
        if (a.year === null) return 1; // unknowns to bottom
        if (b.year === null) return -1;
        return a.year - b.year || a.name.localeCompare(b.name);
      });
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return items;
  }, [cy, dataset, filters, sortMode]);

  const handleLanguageClick = (langId: string) => {
    if (!cy) return;

    const node = cy.getElementById(langId);
    if (!node || node.length === 0) return;

    // Stop any ongoing animations
    cy.stop();

    // Activate focus mode (highlight node + neighbors)
    activateFocusMode(cy, langId);

    // Center and zoom to node with smooth animation
    cy.animate({
      center: { eles: node },
      zoom: 1.5,
    }, {
      duration: 500,
      easing: 'ease-out',
    });
  };

  if (!dataset) return null;

  return (
    <aside className="years-panel">
      <header className="years-header">
        <h2>Years</h2>
        <div className="years-sort">
          <button
            className={sortMode === 'year_asc' ? 'active' : ''}
            onClick={() => setSortMode('year_asc')}
          >
            By Year
          </button>
          <button
            className={sortMode === 'name_asc' ? 'active' : ''}
            onClick={() => setSortMode('name_asc')}
          >
            By Name
          </button>
        </div>
      </header>

      <div className="years-count">
        {visibleLanguages.length} language{visibleLanguages.length !== 1 ? 's' : ''}
      </div>

      <div className="years-list">
        {visibleLanguages.map((item) => (
          <div
            key={item.id}
            className="years-item"
            onClick={() => handleLanguageClick(item.id)}
          >
            <span className="years-name">{item.name}</span>
            <span className="years-year">{item.displayYear}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
