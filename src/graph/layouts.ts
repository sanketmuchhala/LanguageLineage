import type { Core } from 'cytoscape';

// Deterministic random seed for reproducible layouts
const RANDOM_SEED = 42;

// Tree layout - vertical hierarchical (top-down)
export const DAG_LAYOUT: any = {
  name: 'breadthfirst',
  directed: true,
  padding: 50,
  spacingFactor: 2.2,
  avoidOverlap: true,
  nodeDimensionsIncludeLabels: true,
  animate: true,
  animationDuration: 500,
  animationEasing: 'ease-out',
  roots: undefined,
  circle: false,
  grid: false,
  rankDir: 'TB',
  ranker: 'network-simplex',
  fit: true,
};

// Network layout - organic force-directed with collision avoidance
export const FORCE_LAYOUT: any = {
  name: 'cose-bilkent',
  randomize: true,
  animate: true,
  animationDuration: 1500,
  animationEasing: 'ease-in-out',
  quality: 'proof',
  nodeDimensionsIncludeLabels: true,
  nodeRepulsion: 50000,
  idealEdgeLength: 200,
  edgeElasticity: 0.25,
  nestingFactor: 0.1,
  gravity: 0.10,
  gravityRange: 3.8,
  numIter: 5000,
  randomizationSeed: RANDOM_SEED,
  tile: true,
  tilingPaddingVertical: 80,
  tilingPaddingHorizontal: 80,
  fit: true,
  padding: 50,
};

// Cluster layout - group nodes by cluster_hint using compound parents
export const CLUSTER_LAYOUT: any = {
  name: 'cose-bilkent',
  randomize: true,
  animate: true,
  animationDuration: 1500,
  animationEasing: 'ease-in-out',
  quality: 'proof',
  nodeDimensionsIncludeLabels: true,
  nodeRepulsion: 50000,
  idealEdgeLength: 180,
  edgeElasticity: 0.25,
  nestingFactor: 0.1,
  gravity: 0.08,
  gravityRange: 3.8,
  numIter: 5000,
  randomizationSeed: RANDOM_SEED,
  tile: true,
  tilingPaddingVertical: 100,
  tilingPaddingHorizontal: 100,
  fit: true,
  padding: 50,
};

// Timeline layout - horizontal, left=old, right=new
export function buildTimelineLayout(cy: Core): any {
  const nodes = cy.nodes().filter((n: any) => !n.isParent());

  // Group nodes by year
  const yearGroups = new Map<number, any[]>();
  nodes.forEach((node: any) => {
    const year = node.data('first_release_year') || 0;
    if (!yearGroups.has(year)) yearGroups.set(year, []);
    yearGroups.get(year)!.push(node);
  });

  // Sort years left-to-right (oldest first)
  const sortedYears = [...yearGroups.keys()].sort((a, b) => a - b);

  // Build position map: x = year tier, y = lane within tier
  const positions = new Map<string, { x: number; y: number }>();
  const X_SPACING = 150;
  const Y_SPACING = 100;

  sortedYears.forEach((year, tierIndex) => {
    const nodesInYear = yearGroups.get(year)!;
    const tierHeight = nodesInYear.length * Y_SPACING;
    const startY = -tierHeight / 2;

    nodesInYear.forEach((node: any, laneIndex: number) => {
      positions.set(node.id(), {
        x: tierIndex * X_SPACING,
        y: startY + laneIndex * Y_SPACING + Y_SPACING / 2,
      });
    });
  });

  return {
    name: 'preset',
    positions: (node: any) => positions.get(node.id()) || { x: 0, y: 0 },
    animate: true,
    animationDuration: 500,
    animationEasing: 'ease-out',
    fit: true,
    padding: 40,
  };
}
