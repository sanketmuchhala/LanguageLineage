import type { Core } from 'cytoscape';
import { panelInset } from './viewport';

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
  animate: 'end',
  animationDuration: 700,
  animationEasing: 'ease-out',
  quality: 'default',
  nodeDimensionsIncludeLabels: true,
  nodeRepulsion: 38000,
  idealEdgeLength: 135,
  edgeElasticity: 0.25,
  nestingFactor: 0.1,
  gravity: 0.45,
  gravityRange: 2.2,
  numIter: 2500,
  randomizationSeed: RANDOM_SEED,
  tile: true,
  tilingPaddingVertical: 30,
  tilingPaddingHorizontal: 30,
  fit: true,
  padding: 30,
};

// Cluster layout - group nodes by cluster_hint using compound parents.
//
// Deterministic packing rather than a force layout: with compound parents the force
// layout spread the graph over ~33,000px (zoom 0.03 to fit, far below minZoom) and its
// size and overlaps changed from run to run. Here each cluster is a compact grid
// (best-connected nodes first), cells sized from each node and its label, and the
// clusters are packed in rows to the canvas's aspect ratio, so nothing overlaps and the
// whole graph fits.
// Node plus label footprint from data, not from the rendered label: labels are hidden or
// shown by zoom level, and the layout must come out the same either way. Mirrors the node
// style in style.ts (font 13-19px and wrap width 90-150px, both mapped from degree).
function nodeBox(n: any): { w: number; h: number } {
  const t = Math.min(Math.max((n.data('degree') ?? 0) / 30, 0), 1);
  const font = 13 + 6 * t;
  const wrap = 90 + 60 * t;
  const textW = String(n.data('label') ?? '').length * font * 0.6;
  const lines = Math.max(1, Math.ceil(textW / wrap));
  return {
    w: Math.max(n.outerWidth(), Math.min(textW, wrap)),
    h: n.outerHeight() + 8 + lines * font * 1.25,
  };
}

export function buildClusterLayout(cy: Core): any {
  const GAP = 28;
  const CLUSTER_GAP = 130;

  const groups = new Map<string, any[]>();
  cy.nodes().filter((n: any) => !n.isParent()).forEach((n: any) => {
    const key = n.parent().length > 0 ? n.parent().id() : n.id();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  });

  const blocks = [...groups.entries()].map(([id, nodes]) => {
    nodes.sort((a: any, b: any) => b.degree(false) - a.degree(false) || a.id().localeCompare(b.id()));
    const boxes = nodes.map(nodeBox);
    const cellW = Math.max(...boxes.map((b: any) => b.w)) + GAP;
    const cellH = Math.max(...boxes.map((b: any) => b.h)) + GAP;
    const cols = Math.max(1, Math.ceil(Math.sqrt((nodes.length * cellH) / cellW)));
    const rows = Math.ceil(nodes.length / cols);
    return { id, nodes, cellW, cellH, cols, w: cols * cellW, h: rows * cellH };
  }).sort((a, b) => b.h - a.h || b.nodes.length - a.nodes.length || a.id.localeCompare(b.id));

  // Pack for the shape of the area the side panel leaves visible.
  const visibleW = cy.width() - panelInset(cy.container());
  const aspect = visibleW > 0 && cy.height() > 0 ? visibleW / cy.height() : 1.6;
  const area = blocks.reduce((sum, b) => sum + (b.w + CLUSTER_GAP) * (b.h + CLUSTER_GAP), 0);
  const targetW = Math.max(Math.sqrt(area * aspect), ...blocks.map((b) => b.w));

  const positions = new Map<string, { x: number; y: number }>();
  let x = 0;
  let y = 0;
  let rowH = 0;
  for (const b of blocks) {
    if (x > 0 && x + b.w > targetW) {
      x = 0;
      y += rowH + CLUSTER_GAP;
      rowH = 0;
    }
    b.nodes.forEach((n: any, i: number) => {
      positions.set(n.id(), {
        x: x + (i % b.cols) * b.cellW + b.cellW / 2,
        y: y + Math.floor(i / b.cols) * b.cellH + b.cellH / 2,
      });
    });
    x += b.w + CLUSTER_GAP;
    rowH = Math.max(rowH, b.h);
  }

  return {
    name: 'preset',
    positions: (node: any) => positions.get(node.id()),
    animate: true,
    animationDuration: 600,
    animationEasing: 'ease-out',
    fit: true,
    padding: 40,
  };
}

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
