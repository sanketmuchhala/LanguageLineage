import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGraphStore } from '../store/useGraphStore';
import { loadDataset } from '../data/loadDataset';
import { validateDataset } from '../data/validateDataset';
import { normalizeDataset } from '../data/normalizeDataset';
import { indexDataset } from '../data/indexDataset';
import { GraphView } from '../graph/GraphView';
import { MinimalPanel } from '../ui/MinimalPanel';
import { SideDrawer } from '../ui/SideDrawer';
import { Legend } from '../ui/Legend';
import { EdgeTooltip } from '../ui/EdgeTooltip';
import { TimelineControls } from '../ui/TimelineControls';
import { NavigationControls } from '../ui/NavigationControls';
import { deactivateFocusMode } from '../graph/selectors';
import { DAG_LAYOUT, FORCE_LAYOUT, CLUSTER_LAYOUT, buildTimelineLayout } from '../graph/layouts';

export function GraphExplorer() {
  const navigate = useNavigate();
  const { setDataset, setDatasetIndex, setValidationReport } = useGraphStore();

  // Load dataset when graph explorer mounts (not on landing page)
  useEffect(() => {
    async function initializeDataset() {
      try {
        const rawDataset = await loadDataset('v4');
        const validationReport = validateDataset(rawDataset);
        setValidationReport(validationReport);
        const normalizedDataset = normalizeDataset(rawDataset);
        setDataset(normalizedDataset);
        const datasetIndex = indexDataset(normalizedDataset);
        setDatasetIndex(datasetIndex);
      } catch (error) {
        console.error('Failed to load dataset:', error);
      }
    }
    initializeDataset();
  }, [setDataset, setDatasetIndex, setValidationReport]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const state = useGraphStore.getState();

      switch (e.key.toLowerCase()) {
        case 'f':
          if (state.selectedNodeId) {
            state.setExplorationMode(state.explorationMode === 'focus' ? 'none' : 'focus');
          }
          break;
        case 'a':
          if (state.selectedNodeId) {
            state.setExplorationMode(state.explorationMode === 'ancestors' ? 'none' : 'ancestors');
          }
          break;
        case 'd':
          if (state.selectedNodeId) {
            state.setExplorationMode(state.explorationMode === 'descendants' ? 'none' : 'descendants');
          }
          break;
        case 'escape':
          state.setSelectedNode(null);
          state.setSelectedEdge(null);
          if (state.cy) deactivateFocusMode(state.cy);
          break;
        case 'r': {
          const { cy, filters } = state;
          if (!cy) break;
          let layout;
          switch (filters.layoutMode) {
            case 'dag': layout = DAG_LAYOUT; break;
            case 'cluster': layout = CLUSTER_LAYOUT; break;
            case 'timeline': layout = buildTimelineLayout(cy); break;
            case 'force':
            default: layout = FORCE_LAYOUT; break;
          }
          cy.layout(layout).run();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBackToLanding = () => {
    navigate('/');
  };

  return (
    <div className="app">
      <div className="graph-container">
        <GraphView />
        <MinimalPanel onBackToLanding={handleBackToLanding} />
        <Legend />
        <EdgeTooltip />
        <TimelineControls />
        <NavigationControls />
      </div>
      <SideDrawer />
    </div>
  );
}

export default GraphExplorer;
