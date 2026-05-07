import type { CytoscapeOptions } from 'cytoscape';

export const BASE_CYTOSCAPE_CONFIG: Partial<CytoscapeOptions> = {
  // Zoom and pan settings
  minZoom: 0.15,
  maxZoom: 3.0,
  wheelSensitivity: 0.15,

  // Interaction settings
  autoungrabify: false,
  autounselectify: false,
  boxSelectionEnabled: false,

  // Performance & Quality
  hideEdgesOnViewport: false,
  textureOnViewport: false,
  motionBlur: false,

  // Style - Use high pixel ratio for crisp rendering
  pixelRatio: 2, // Force 2x for crisp nodes and text
};
