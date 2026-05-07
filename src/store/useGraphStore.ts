import { create } from 'zustand';
import type { Core } from 'cytoscape';
import type { NormalizedDataset, FilterState, ValidationReport } from '../data/types';
import { DatasetIndex } from '../data/indexDataset';

interface GraphStore {
  // Data
  dataset: NormalizedDataset | null;
  datasetIndex: DatasetIndex | null;
  validationReport: ValidationReport | null;

  // Cytoscape instance
  cy: Core | null;

  // Filters
  filters: FilterState;

  // UI State
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  sideDrawerOpen: boolean;
  hoveredEdgeId: string | null;
  hoveredEdgePosition: { x: number; y: number } | null;
  timelineYear: number;
  isTimelinePlaying: boolean;
  explorationMode: 'none' | 'ancestors' | 'descendants' | 'focus';
  attributeFilters: { paradigms: string[]; typing: string | null; decade: number | null };
  isDarkMode: boolean;

  // Actions
  setDataset: (dataset: NormalizedDataset) => void;
  setDatasetIndex: (index: DatasetIndex) => void;
  setValidationReport: (report: ValidationReport) => void;
  setCytoscape: (cy: Core | null) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setSelectedEdge: (edgeId: string | null) => void;
  setSideDrawerOpen: (open: boolean) => void;
  setHoveredEdge: (edgeId: string | null, position?: { x: number; y: number }) => void;
  setTimelineYear: (year: number) => void;
  setIsTimelinePlaying: (playing: boolean) => void;
  setExplorationMode: (mode: 'none' | 'ancestors' | 'descendants' | 'focus') => void;
  setAttributeFilters: (filters: Partial<{ paradigms: string[]; typing: string | null; decade: number | null }>) => void;
  resetAttributeFilters: () => void;
  resetFilters: () => void;
  toggleDarkMode: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  confidenceThreshold: 0.0,
  relationshipFilters: {
    compiler_written_in: true,
    runtime_written_in: true,
    bootstrap_written_in: true,
    rewritten_in: true,
    influenced: false,
    influenced_by: false,
    transpiled_to: true,
  },
  showSelfLoops: false,
  clusterColoring: true,
  showAllLabels: false, // Progressive disclosure by default; toggle on for all labels
  layoutMode: 'force',
  graphMode: 'implementation',
};

export const useGraphStore = create<GraphStore>((set) => ({
  // Initial state
  dataset: null,
  datasetIndex: null,
  validationReport: null,
  cy: null,
  filters: DEFAULT_FILTERS,
  selectedNodeId: null,
  selectedEdgeId: null,
  sideDrawerOpen: false,
  hoveredEdgeId: null,
  hoveredEdgePosition: null,
  timelineYear: 2023,
  isTimelinePlaying: false,
  explorationMode: 'none',
  attributeFilters: { paradigms: [], typing: null, decade: null },
  isDarkMode: true,

  // Actions
  setDataset: (dataset) => set({ dataset }),
  setDatasetIndex: (index) => set({ datasetIndex: index }),
  setValidationReport: (report) => set({ validationReport: report }),
  setCytoscape: (cy) => set({ cy }),

  updateFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  setSelectedNode: (nodeId) =>
    set((state) => ({
      selectedNodeId: nodeId,
      selectedEdgeId: null,
      sideDrawerOpen: nodeId !== null,
      explorationMode: nodeId === null ? 'none' as const : state.explorationMode,
    })),

  setSelectedEdge: (edgeId) =>
    set({
      selectedEdgeId: edgeId,
      selectedNodeId: null,
      sideDrawerOpen: edgeId !== null,
    }),

  setSideDrawerOpen: (open) => set({ sideDrawerOpen: open }),

  setHoveredEdge: (edgeId, position) =>
    set({
      hoveredEdgeId: edgeId,
      hoveredEdgePosition: position || null,
    }),

  setTimelineYear: (year) => set({ timelineYear: year }),
  setIsTimelinePlaying: (playing) => set({ isTimelinePlaying: playing }),

  setExplorationMode: (mode) => set({ explorationMode: mode }),
  setAttributeFilters: (filters) =>
    set((state) => ({
      attributeFilters: { ...state.attributeFilters, ...filters },
    })),
  resetAttributeFilters: () =>
    set({ attributeFilters: { paradigms: [], typing: null, decade: null } }),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode;
      // Dark mode is default, so we add .light class when NOT in dark mode
      document.documentElement.classList.toggle('light', !next);
      return { isDarkMode: next };
    }),
}));
