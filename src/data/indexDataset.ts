import type { NormalizedDataset, NormalizedEdge } from './types';

export interface DatasetIndex {
  incomingEdges: Map<string, NormalizedEdge[]>;
  outgoingEdges: Map<string, NormalizedEdge[]>;
}

export function indexDataset(dataset: NormalizedDataset): DatasetIndex {
  const incomingEdges = new Map<string, NormalizedEdge[]>();
  const outgoingEdges = new Map<string, NormalizedEdge[]>();

  // Initialize maps for all languages
  for (const lang of dataset.languages) {
    incomingEdges.set(lang.id, []);
    outgoingEdges.set(lang.id, []);
  }

  // Build edge indexes
  for (const edge of dataset.edges) {
    const incoming = incomingEdges.get(edge.to_language) || [];
    incoming.push(edge);
    incomingEdges.set(edge.to_language, incoming);

    const outgoing = outgoingEdges.get(edge.from_language) || [];
    outgoing.push(edge);
    outgoingEdges.set(edge.from_language, outgoing);
  }

  return {
    incomingEdges,
    outgoingEdges,
  };
}
