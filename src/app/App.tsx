import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
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
import { LandingPage } from '../ui/LandingPage';
import { deactivateFocusMode } from '../graph/selectors';
import { DAG_LAYOUT, FORCE_LAYOUT, CLUSTER_LAYOUT, buildTimelineLayout } from '../graph/layouts';

import './App.css';

// Graph Explorer Page Component
function GraphExplorer() {
  const navigate = useNavigate();

  const handleBackToLanding = () => {
    navigate('/');
  };

  // Keyboard shortcuts for graph view
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

// Landing Page Wrapper
function LandingPageWrapper() {
  const navigate = useNavigate();

  const handleEnterGraph = () => {
    navigate('/explore');
  };

  return <LandingPage onEnterGraph={handleEnterGraph} />;
}

function App() {
  const { setDataset, setDatasetIndex, setValidationReport } = useGraphStore();

  // Load dataset on app mount
  useEffect(() => {
    async function initializeDataset() {
      try {
        console.log('Loading dataset...');
        const rawDataset = await loadDataset('v4');

        console.log('Validating dataset...');
        const validationReport = validateDataset(rawDataset);
        setValidationReport(validationReport);

        console.log('Normalizing dataset...');
        const normalizedDataset = normalizeDataset(rawDataset);
        setDataset(normalizedDataset);

        console.log('Indexing dataset...');
        const datasetIndex = indexDataset(normalizedDataset);
        setDatasetIndex(datasetIndex);

        console.log('Dataset loaded successfully');
      } catch (error) {
        console.error('Failed to load dataset:', error);
      }
    }

    initializeDataset();
  }, [setDataset, setDatasetIndex, setValidationReport]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPageWrapper />} />
        <Route path="/explore" element={<GraphExplorer />} />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  );
}

export default App;
