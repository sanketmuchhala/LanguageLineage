import type { Core } from 'cytoscape';
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

  // Fade all elements
  cy.elements().addClass('faded');

  // Highlight selected node, neighbors, and connecting edges
  node.removeClass('faded').addClass('highlighted');
  neighbors.removeClass('faded').addClass('highlighted');
  connectedEdges.removeClass('faded').addClass('highlighted');
}

// Deactivate focus mode: Remove all highlighting and fading
export function deactivateFocusMode(cy: Core): void {
  cy.elements().removeClass('faded highlighted');
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
    cy.elements().addClass('faded').removeClass('highlighted');

    const selectedNode = cy.getElementById(nodeId);
    selectedNode.removeClass('faded').addClass('highlighted');

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
  filters: { paradigms: string[]; typing: string | null; decade: number | null },
  dataset: NormalizedDataset
): void {
  const hasFilters = filters.paradigms.length > 0 || filters.typing !== null || filters.decade !== null;

  if (!hasFilters) {
    cy.batch(() => {
      cy.elements().removeClass('attribute-faded');
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

      if (matches) {
        node.removeClass('attribute-faded');
      } else {
        node.addClass('attribute-faded');
      }
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

// Highlight a specific edge
export function highlightEdge(cy: Core, edgeId: string): void {
  const edge = cy.getElementById(edgeId);

  if (!edge || edge.length === 0) {
    return;
  }

  const sourceNode = edge.source();
  const targetNode = edge.target();

  // Fade all elements
  cy.elements().addClass('faded');

  // Highlight edge and connected nodes
  edge.removeClass('faded').addClass('highlighted');
  sourceNode.removeClass('faded').addClass('highlighted');
  targetNode.removeClass('faded').addClass('highlighted');
}
