import { aiViewNodeIds } from '../data/aiExplainers';
import type { Core, NodeCollection } from 'cytoscape';
import type { DatasetIndex } from '../data/indexDataset';
import type { NormalizedDataset } from '../data/types';

// Focus mode: Highlight selected node and its 1-hop neighbors, fade everything else
export function activateFocusMode(cy: Core, nodeId: string): void {
  const node = cy.getElementById(nodeId);

  if (!node || node.length === 0) {
    return;
  }

  const neighbors = node.neighborhood('node');
  const connectedEdges = node.connectedEdges();

  cy.elements().addClass('faded');

  node.removeClass('faded').addClass('highlighted selected');
  neighbors.removeClass('faded').addClass('highlighted');
  connectedEdges.removeClass('faded').addClass('highlighted');
}

// Deactivate focus mode: Remove all highlighting and fading
export function deactivateFocusMode(cy: Core): void {
  cy.elements().removeClass('faded highlighted selected');
}

// Timeline visibility: hide nodes/edges beyond the selected year
export function applyTimelineVisibility(cy: Core, year: number): void {
  cy.batch(() => {
    cy.nodes().forEach((node: any) => {
      if (node.isParent()) return;
      const releaseYear = node.data('first_release_year') || 0;
      if (releaseYear > year) {
        node.addClass('timeline-hidden');
      } else {
        node.removeClass('timeline-hidden');
      }
    });

    cy.edges().forEach((edge: any) => {
      const sourceYear = edge.source().data('first_release_year') || 0;
      const targetYear = edge.target().data('first_release_year') || 0;
      const startYear = edge.data('start_year');
      const endYear = edge.data('end_year');

      const hidden =
        sourceYear > year ||
        targetYear > year ||
        (startYear !== null && startYear > year) ||
        (endYear !== null && endYear < year);

      if (hidden) {
        edge.addClass('timeline-hidden');
      } else {
        edge.removeClass('timeline-hidden');
      }
    });
  });
}

// Clear all timeline visibility classes
export function clearTimelineVisibility(cy: Core): void {
  cy.batch(() => {
    cy.elements().removeClass('timeline-hidden');
  });
}

// BFS backward: collect all ancestor node IDs
export function getAncestors(index: DatasetIndex, nodeId: string): Set<string> {
  const visited = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const incoming = index.incomingEdges.get(current) || [];
    for (const edge of incoming) {
      if (!visited.has(edge.from_language)) {
        visited.add(edge.from_language);
        queue.push(edge.from_language);
      }
    }
  }

  return visited;
}

// BFS forward: collect all descendant node IDs
export function getDescendants(index: DatasetIndex, nodeId: string): Set<string> {
  const visited = new Set<string>();
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const outgoing = index.outgoingEdges.get(current) || [];
    for (const edge of outgoing) {
      if (!visited.has(edge.to_language)) {
        visited.add(edge.to_language);
        queue.push(edge.to_language);
      }
    }
  }

  return visited;
}

// Highlight selected node + related nodes, fade everything else
export function activateExplorationMode(cy: Core, nodeId: string, relatedNodes: Set<string>): void {
  cy.batch(() => {
    cy.elements().addClass('faded').removeClass('highlighted selected');

    const selectedNode = cy.getElementById(nodeId);
    selectedNode.removeClass('faded').addClass('highlighted selected');

    relatedNodes.forEach((id) => {
      cy.getElementById(id).removeClass('faded').addClass('highlighted');
    });

    // Highlight edges between any two highlighted nodes
    cy.edges().forEach((edge: any) => {
      const srcHighlighted = edge.source().hasClass('highlighted');
      const tgtHighlighted = edge.target().hasClass('highlighted');
      if (srcHighlighted && tgtHighlighted) {
        edge.removeClass('faded').addClass('highlighted');
      }
    });
  });
}

// Attribute filters: fade nodes that don't match active filters
export function applyAttributeFilters(
  cy: Core,
  filters: { paradigms: string[]; typing: string | null; decade: number | null; ai: boolean },
  dataset: NormalizedDataset
): void {
  const hasFilters = filters.paradigms.length > 0 || filters.typing !== null || filters.decade !== null || filters.ai;
  const aiIds = filters.ai ? aiViewNodeIds(dataset.edges) : null;

  if (!hasFilters) {
    cy.batch(() => {
      cy.elements().removeClass('attribute-faded');
      cy.nodes().removeClass('ai-focus');
    });
    return;
  }

  cy.batch(() => {
    cy.nodes().forEach((node: any) => {
      if (node.isParent()) return;

      const lang = dataset.languageMap.get(node.id());
      if (!lang) return;

      let matches = true;

      if (filters.paradigms.length > 0) {
        const nodeParadigms = lang.paradigm || [];
        matches = matches && nodeParadigms.some((p) => filters.paradigms.includes(p));
      }

      if (filters.typing !== null) {
        matches = matches && lang.typing === filters.typing;
      }

      if (filters.decade !== null) {
        const year = lang.first_release_year;
        matches = matches && year >= filters.decade && year <= filters.decade + 9;
      }

      if (aiIds) {
        matches = matches && aiIds.has(node.id());
      }

      if (matches) {
        node.removeClass('attribute-faded');
      } else {
        node.addClass('attribute-faded');
      }
      // Labels stay on for the AI view's nodes whatever the zoom level.
      if (matches && aiIds) node.addClass('ai-focus');
      else node.removeClass('ai-focus');
    });

    cy.edges().forEach((edge: any) => {
      const srcFaded = edge.source().hasClass('attribute-faded');
      const tgtFaded = edge.target().hasClass('attribute-faded');
      if (srcFaded || tgtFaded) {
        edge.addClass('attribute-faded');
      } else {
        edge.removeClass('attribute-faded');
      }
    });
  });
}

/**
 * Zoom to the nodes of the AI infrastructure view, inside the part of the canvas that is
 * not covered on the left by an open side panel (`leftInset`, in rendered pixels).
 * No animation with reduced motion.
 */
export function fitToAiView(cy: Core, leftInset = 0): void {
  fitNodesInView(cy, cy.nodes('.ai-focus'), leftInset);
}

/** Zoom to some nodes inside the canvas area right of `leftInset`; no-op if they cannot fit. */
export function fitNodesInView(cy: Core, eles: NodeCollection, leftInset = 0): void {
  if (eles.length === 0) return;
  const pad = 70;
  const bb = eles.boundingBox({ includeLabels: true });
  const availW = Math.max(cy.width() - leftInset - pad * 2, 100);
  const availH = Math.max(cy.height() - pad * 2, 100);
  const needed = Math.min(availW / bb.w, availH / bb.h);
  // Layouts that spread the AI tools apart (Cluster) cannot fit them above the minimum
  // zoom; keep the layout's own fit-everything view rather than cut nodes off.
  if (needed < cy.minZoom()) return;
  const zoom = Math.min(needed, 1.6, cy.maxZoom());
  const pan = {
    x: leftInset + pad + availW / 2 - zoom * (bb.x1 + bb.w / 2),
    y: pad + availH / 2 - zoom * (bb.y1 + bb.h / 2),
  };
  const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm) cy.viewport({ zoom, pan });
  else cy.animate({ zoom, pan }, { duration: 600, easing: 'ease-in-out-cubic' });
}

/**
 * AI path overlay: highlight the atlas nodes an explainer path passes through and fade
 * the rest. Edges stay faded on purpose: graph edges mean "written in", not the
 * execution steps, which only the explainer page shows.
 */
export function activateAiOverlay(cy: Core, nodeIds: string[]): void {
  cy.batch(() => {
    cy.elements().addClass('faded').removeClass('highlighted selected');
    for (const id of nodeIds) cy.getElementById(id).removeClass('faded').addClass('highlighted');
  });
}

// BFS shortest path between two nodes (treats graph as undirected for traversal)
export function findShortestPath(
  index: DatasetIndex,
  fromId: string,
  toId: string,
  activeRelTypes: Set<string>
): { nodes: string[]; edgeIds: string[] } | null {
  if (fromId === toId) return { nodes: [fromId], edgeIds: [] };

  type Prev = { nodeId: string; edgeId: string } | null;
  const visited = new Map<string, Prev>();
  visited.set(fromId, null);
  const queue: string[] = [fromId];

  let found = false;
  outer: while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of index.outgoingEdges.get(current) || []) {
      if (!activeRelTypes.has(edge.relationship)) continue;
      if (!visited.has(edge.to_language)) {
        visited.set(edge.to_language, { nodeId: current, edgeId: edge.id });
        if (edge.to_language === toId) { found = true; break outer; }
        queue.push(edge.to_language);
      }
    }
    for (const edge of index.incomingEdges.get(current) || []) {
      if (!activeRelTypes.has(edge.relationship)) continue;
      if (!visited.has(edge.from_language)) {
        visited.set(edge.from_language, { nodeId: current, edgeId: edge.id });
        if (edge.from_language === toId) { found = true; break outer; }
        queue.push(edge.from_language);
      }
    }
  }

  if (!found && !visited.has(toId)) return null;

  const nodes: string[] = [];
  const edgeIds: string[] = [];
  let cur = toId;
  while (cur !== fromId) {
    nodes.unshift(cur);
    const prev = visited.get(cur)!;
    if (!prev) break;
    edgeIds.unshift(prev.edgeId);
    cur = prev.nodeId;
  }
  nodes.unshift(fromId);

  return { nodes, edgeIds };
}

// Highlight a trace path: endpoints are .selected, intermediate nodes are .highlighted
export function activateTracePath(cy: Core, pathNodeIds: string[], pathEdgeIds: string[]): void {
  cy.batch(() => {
    cy.elements().addClass('faded').removeClass('highlighted selected');
    pathNodeIds.forEach((id, i) => {
      const node = cy.getElementById(id);
      node.removeClass('faded');
      if (i === 0 || i === pathNodeIds.length - 1) {
        node.addClass('highlighted selected');
      } else {
        node.addClass('highlighted');
      }
    });
    pathEdgeIds.forEach((id) => {
      cy.getElementById(id).removeClass('faded').addClass('highlighted');
    });
  });
}

// Highlight a specific edge
export function highlightEdge(cy: Core, edgeId: string): void {
  const edge = cy.getElementById(edgeId);

  if (!edge || edge.length === 0) {
    return;
  }

  const sourceNode = edge.source();
  const targetNode = edge.target();

  cy.elements().addClass('faded').removeClass('selected');

  edge.removeClass('faded').addClass('highlighted');
  sourceNode.removeClass('faded').addClass('highlighted selected');
  targetNode.removeClass('faded').addClass('highlighted');
}
