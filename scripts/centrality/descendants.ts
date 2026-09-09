/**
 * Transitive descendant counts over a directed graph.
 *
 * For an edge `a -> b` ("a influenced b" or "a implemented b" depending on
 * the caller), the descendants of `a` are every node reachable by following
 * edges forward — everything downstream of it, however many hops away.
 */

export interface Edge {
  from: string;
  to: string;
}

/** Every node reachable forward from `start`, not including `start` itself.
 *  Safe on cyclic graphs — a `start` node reachable from itself via a cycle
 *  is not counted as its own descendant. */
export function descendantsOf(edges: Edge[], start: string): Set<string> {
  const forward = buildForwardAdjacency(edges);
  const seen = new Set<string>();
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const next of forward.get(current) ?? []) {
      if (next !== start && !seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }

  return seen;
}

/** Descendant sets for every id in `nodeIds`, computed over the same edge
 *  list. One adjacency build shared across all of them. */
export function transitiveDescendants(edges: Edge[], nodeIds: string[]): Map<string, Set<string>> {
  const forward = buildForwardAdjacency(edges);
  const result = new Map<string, Set<string>>();

  for (const start of nodeIds) {
    const seen = new Set<string>();
    const stack = [start];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const next of forward.get(current) ?? []) {
        if (next !== start && !seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    result.set(start, seen);
  }

  return result;
}

function buildForwardAdjacency(edges: Edge[]): Map<string, string[]> {
  const forward = new Map<string, string[]>();
  for (const { from, to } of edges) {
    const list = forward.get(from) ?? [];
    list.push(to);
    forward.set(from, list);
  }
  return forward;
}
