/** Shared discovery rules for dataset-driven pages and their sitemap entries. */
// Existing GSC-derived exceptions: these question pages canonicalize to the
// stronger language page and stay out of the sitemap. Elm deliberately remains
// self-canonical because its question page performs better (npm run gsc:analyze).
export const QUESTION_CANONICAL_TO_LANG = new Set(['rust', 'python', 'roc', 'prolog']);
const HAND_AUTHORED_QUESTIONS = new Set(['python', 'javascript', 'rust', 'go', 'java', 'c', 'cxx', 'typescript', 'ruby']);
const IMPLEMENTATION_TYPES = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in']);

export function idToSlug(id: string): string {
  return id.replace(/^(lang|tool):/, '').replace(/_/g, '-');
}

export function idToPrefix(id: string): string {
  return id.startsWith('tool:') ? 'tools' : 'languages';
}

interface Node { id: string }
interface Edge { relationship: string; to_language: string }

export function discoverAutoQuestions<N extends Node, R extends Edge>(
  nodes: N[], relationships: R[], enrichment: Record<string, unknown>,
): Array<{ node: N; implEdges: R[] }> {
  const incoming = new Map<string, R[]>();
  for (const edge of relationships) {
    if (!IMPLEMENTATION_TYPES.has(edge.relationship)) continue;
    const edges = incoming.get(edge.to_language) ?? [];
    edges.push(edge);
    incoming.set(edge.to_language, edges);
  }
  return nodes.flatMap(node => {
    if (!node.id.startsWith('lang:') || HAND_AUTHORED_QUESTIONS.has(idToSlug(node.id)) || !enrichment[node.id]) return [];
    const implEdges = incoming.get(node.id) ?? [];
    return implEdges.length ? [{ node, implEdges }] : [];
  });
}
