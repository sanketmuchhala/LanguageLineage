import type { NormalizedDataset, NormalizedRelationship } from './types_v6';

export interface DatasetIndex {
  incomingEdges: Map<string, NormalizedRelationship[]>;
  outgoingEdges: Map<string, NormalizedRelationship[]>;
}

export function indexDataset(dataset: NormalizedDataset): DatasetIndex {
  const incomingEdges = new Map<string, NormalizedRelationship[]>();
  const outgoingEdges = new Map<string, NormalizedRelationship[]>();

  // Initialize maps for all languages
  for (const lang of dataset.entities) {
    incomingEdges.set(lang.id, []);
    outgoingEdges.set(lang.id, []);
  }

  // Build edge indexes
  for (const edge of dataset.relationships) {
    const incoming = incomingEdges.get(edge.to) || [];
    incoming.push(edge);
    incomingEdges.set(edge.to, incoming);

    const outgoing = outgoingEdges.get(edge.from) || [];
    outgoing.push(edge);
    outgoingEdges.set(edge.from, outgoing);
  }

  return {
    incomingEdges,
    outgoingEdges,
  };
}
