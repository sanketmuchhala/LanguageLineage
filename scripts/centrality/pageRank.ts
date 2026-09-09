/**
 * Reverse PageRank over a directed influence graph.
 *
 * An edge `a -> b` here means "a influenced b". Standard PageRank rewards
 * incoming edges, so running it directly would rank languages that were
 * influenced by many things, not languages that influenced many things.
 * "Reverse" means the edges are flipped before scoring (b -> a), so rank
 * flows backward through the influence chain and accumulates on root
 * influencers instead — the actual claim this ranking makes.
 */

export interface Edge {
  from: string;
  to: string;
}

const DEFAULT_ITERATIONS = 100;
const CONVERGENCE_EPSILON = 1e-9;

/**
 * Computes reverse PageRank. `nodeIds` must include every node that can
 * appear in `edges` — isolated nodes (no edges at all) are scored too, so
 * the result always sums to 1 across the full node set.
 */
export function reversePageRank(
  edges: Edge[],
  nodeIds: string[],
  damping = 0.85,
  iterations = DEFAULT_ITERATIONS
): Map<string, number> {
  const n = nodeIds.length;
  if (n === 0) return new Map();

  const index = new Map(nodeIds.map((id, i) => [id, i]));

  // Reversed adjacency: outReversed[i] = the nodes i points to in the
  // reversed graph, i.e. for original edge (a -> b), reversed has b -> a,
  // so outReversed[index(b)] gains index(a).
  const outReversed: number[][] = Array.from({ length: n }, () => []);
  for (const { from, to } of edges) {
    const a = index.get(from);
    const b = index.get(to);
    if (a === undefined || b === undefined) continue; // out-of-scope node, e.g. a tool: id when scoping to lang:
    outReversed[b].push(a);
  }

  let scores = new Array(n).fill(1 / n);
  const base = (1 - damping) / n;

  for (let iter = 0; iter < iterations; iter++) {
    const next = new Array(n).fill(base);
    let danglingShare = 0;

    for (let i = 0; i < n; i++) {
      const outs = outReversed[i];
      if (outs.length === 0) {
        // A node with no reversed out-edges (i.e. nothing in the original
        // graph points to it) has nowhere to send its rank. Standard fix:
        // redistribute evenly across every node so total rank is conserved.
        danglingShare += damping * scores[i] / n;
        continue;
      }
      const share = (damping * scores[i]) / outs.length;
      for (const j of outs) next[j] += share;
    }

    if (danglingShare > 0) {
      for (let i = 0; i < n; i++) next[i] += danglingShare;
    }

    let delta = 0;
    for (let i = 0; i < n; i++) delta += Math.abs(next[i] - scores[i]);
    scores = next;
    if (delta < CONVERGENCE_EPSILON) break;
  }

  const result = new Map<string, number>();
  for (let i = 0; i < n; i++) result.set(nodeIds[i], scores[i]);
  return result;
}
