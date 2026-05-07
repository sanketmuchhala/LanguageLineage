import { useGraphStore } from '../store/useGraphStore';
import { DAG_LAYOUT, FORCE_LAYOUT, CLUSTER_LAYOUT, buildTimelineLayout } from '../graph/layouts';
import './NavigationControls.css';

export function NavigationControls() {
  const handleFit = () => {
    const cy = useGraphStore.getState().cy;
    if (!cy) return;
    cy.animate({ fit: { eles: cy.elements(), padding: 50 } } as any, { duration: 400 } as any);
  };

  const handleCenter = () => {
    const { cy, selectedNodeId } = useGraphStore.getState();
    if (!cy || !selectedNodeId) return;
    const node = cy.getElementById(selectedNodeId);
    if (node.length === 0) return;
    cy.animate({ center: { eles: node }, zoom: 1.5 } as any, { duration: 400 } as any);
  };

  const handleReset = () => {
    const { cy, filters } = useGraphStore.getState();
    if (!cy) return;
    let layout;
    switch (filters.layoutMode) {
      case 'dag': layout = DAG_LAYOUT; break;
      case 'cluster': layout = CLUSTER_LAYOUT; break;
      case 'timeline': layout = buildTimelineLayout(cy); break;
      case 'force':
      default: layout = FORCE_LAYOUT; break;
    }
    cy.layout(layout).run();
  };

  return (
    <div className="nav-controls">
      <button className="nav-btn" onClick={handleFit} title="Fit all nodes in view">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
        </svg>
      </button>
      <button className="nav-btn" onClick={handleCenter} title="Center on selected node">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        </svg>
      </button>
      <button className="nav-btn" onClick={handleReset} title="Reset layout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 4v6h6M23 20v-6h-6"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
      </button>
    </div>
  );
}
