/**
 * Implementation closures: "how much of the dataset traces an implementation
 * chain back to this node (or set of nodes)". Distinct from the influence
 * graph used by pageRank.ts/descendants.ts — this is meant to run over
 * compiler_written_in / runtime_written_in / bootstrap_written_in edges,
 * where an edge `a -> b` means "b's compiler/runtime/bootstrap chain is a".
 */

import { descendantsOf, type Edge } from './descendants.js';

/** The roots themselves plus every node whose implementation chain reaches
 *  back to at least one of them. E.g. implementationClosure(edges, ['lang:c',
 *  'lang:cxx']) answers "how many nodes trace back to C or C++". */
export function implementationClosure(edges: Edge[], rootIds: string[]): Set<string> {
  const closure = new Set<string>(rootIds);
  for (const root of rootIds) {
    for (const descendant of descendantsOf(edges, root)) {
      closure.add(descendant);
    }
  }
  return closure;
}
