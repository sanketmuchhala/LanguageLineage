import type { NormalizedDataset, NormalizedEdge } from '../../data/types';
import {
  OUTPUT_RELATIONSHIPS,
  VIRTUAL_ROOT_ID,
  VIRTUAL_ROOT_NAME,
  type BuildHierarchyOptions,
  type HierarchyResult,
  type SecondaryParent,
  type TranspileTarget,
  type TreeNodeDatum,
  type TreeRelationship,
} from './treeTypes';

/**
 * Turns the implementation graph into a tree.
 *
 * The dataset is a directed graph with multiple parents, self-loops and cycles,
 * none of which a tree can express directly. Rather than dropping those edges,
 * this keeps exactly one parent per node for the tree's shape and preserves
 * everything else as secondary relationships hanging off the node.
 *
 * Edge direction: `from_language` is the implementing language and
 * `to_language` is the thing built with it, so `from` is the parent and the
 * tree reads left (implementation) to right (implemented).
 */

function toRelationship(edge: NormalizedEdge): TreeRelationship {
  return {
    id: edge.id,
    relationship: edge.relationship,
    confidence: edge.confidence,
    start_year: edge.start_year,
    end_year: edge.end_year,
    evidence_source: edge.evidence_source,
    notes: edge.notes ?? null,
  };
}

/**
 * Ranks two candidate parent edges. Returns < 0 when `a` is the better parent.
 * Order, as specified: highest confidence, then still-active, then most recent.
 * Ties break on parent id so the same dataset always yields the same tree.
 */
function compareCandidates(a: NormalizedEdge, b: NormalizedEdge): number {
  if (a.confidence !== b.confidence) return b.confidence - a.confidence;

  const aActive = a.end_year === null ? 1 : 0;
  const bActive = b.end_year === null ? 1 : 0;
  if (aActive !== bActive) return bActive - aActive;

  const aStart = a.start_year ?? -Infinity;
  const bStart = b.start_year ?? -Infinity;
  if (aStart !== bStart) return bStart - aStart;

  return a.from_language.localeCompare(b.from_language);
}

/** Walks up `parentOf` from `startId`; true when `startId` is reachable from itself. */
function createsCycle(
  parentOf: Map<string, string>,
  childId: string,
  candidateParentId: string
): boolean {
  if (childId === candidateParentId) return true;
  const seen = new Set<string>([childId]);
  let cursor: string | undefined = candidateParentId;
  while (cursor !== undefined) {
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = parentOf.get(cursor);
  }
  return false;
}

export function buildHierarchy(
  dataset: NormalizedDataset | null,
  options: BuildHierarchyOptions
): HierarchyResult {
  const emptyRoot: TreeNodeDatum = {
    id: VIRTUAL_ROOT_ID,
    name: VIRTUAL_ROOT_NAME,
    isVirtualRoot: true,
    selfHosted: false,
    selfHostRelationships: [],
    primaryRelationships: [],
    secondaryParents: [],
    transpilesTo: [],
    children: [],
  };

  if (!dataset || dataset.languages.length === 0) {
    return { root: emptyRoot, nodeCount: 0, cycleBreaks: [] };
  }

  // The tree models implementation only. Influence mode has no build hierarchy
  // to show, so it renders an explicit empty state instead of a wrong one.
  if (options.graphMode === 'influence') {
    return { root: emptyRoot, nodeCount: 0, cycleBreaks: [] };
  }

  // 1. Keep only implementation edges that pass the active filters.
  const selfHostEdges = new Map<string, TreeRelationship[]>();
  const candidatesByChild = new Map<string, NormalizedEdge[]>();
  const outputEdgesBySource = new Map<string, NormalizedEdge[]>();
  const outputTypes = new Set<string>(OUTPUT_RELATIONSHIPS);

  for (const edge of dataset.edges) {
    if (edge.relationship === 'influenced' || edge.relationship === 'influenced_by') continue;
    if (!options.relationshipFilters[edge.relationship]) continue;
    if (edge.confidence < options.confidenceThreshold) continue;
    if (!dataset.languageMap.has(edge.from_language)) continue;
    if (!dataset.languageMap.has(edge.to_language)) continue;

    // 2. Self-hosting becomes a badge, never a child of itself.
    if (edge.from_language === edge.to_language) {
      const list = selfHostEdges.get(edge.to_language) ?? [];
      list.push(toRelationship(edge));
      selfHostEdges.set(edge.to_language, list);
      continue;
    }

    // 3. Transpilation points source -> output, the opposite of "built with",
    //    so it is recorded on the source and never used to pick a parent.
    if (outputTypes.has(edge.relationship)) {
      const list = outputEdgesBySource.get(edge.from_language) ?? [];
      list.push(edge);
      outputEdgesBySource.set(edge.from_language, list);
      continue;
    }

    const list = candidatesByChild.get(edge.to_language) ?? [];
    list.push(edge);
    candidatesByChild.set(edge.to_language, list);
  }

  // 3. Pick one primary parent per child, rejecting any choice that would close
  //    a cycle. Children are processed in id order so the result is stable.
  const parentOf = new Map<string, string>();
  const primaryEdgesOf = new Map<string, NormalizedEdge[]>();
  const cycleBreaks: HierarchyResult['cycleBreaks'] = [];
  const cycleRejected = new Map<string, Set<string>>();

  const childIds = [...candidatesByChild.keys()].sort();

  for (const childId of childIds) {
    const candidates = [...candidatesByChild.get(childId)!].sort(compareCandidates);

    // Group by parent first: several edges to the same parent are one candidate.
    const byParent = new Map<string, NormalizedEdge[]>();
    for (const edge of candidates) {
      const list = byParent.get(edge.from_language) ?? [];
      list.push(edge);
      byParent.set(edge.from_language, list);
    }

    // Map preserves insertion order, which is already best-first.
    for (const [parentId, edges] of byParent) {
      if (createsCycle(parentOf, childId, parentId)) {
        const rejected = cycleRejected.get(childId) ?? new Set<string>();
        rejected.add(parentId);
        cycleRejected.set(childId, rejected);
        cycleBreaks.push({ childId, parentId });
        continue;
      }
      parentOf.set(childId, parentId);
      primaryEdgesOf.set(childId, edges);
      break;
    }
  }

  // 4. Materialise one datum per language.
  const data = new Map<string, TreeNodeDatum>();
  for (const lang of dataset.languages) {
    const selfRels = selfHostEdges.get(lang.id) ?? [];
    data.set(lang.id, {
      id: lang.id,
      name: lang.name,
      isVirtualRoot: false,
      selfHosted: selfRels.length > 0 || lang.self_hosting === true,
      selfHostRelationships: selfRels,
      primaryRelationships: (primaryEdgesOf.get(lang.id) ?? []).map(toRelationship),
      secondaryParents: [],
      transpilesTo: [],
      children: [],
      cluster: lang.cluster,
      firstReleaseYear: lang.first_release_year,
      degree: lang.degree,
    });
  }

  // Attach transpilation targets to their source node.
  for (const [sourceId, edges] of outputEdgesBySource) {
    const datum = data.get(sourceId);
    if (!datum) continue;
    const byTarget = new Map<string, NormalizedEdge[]>();
    for (const edge of edges) {
      const list = byTarget.get(edge.to_language) ?? [];
      list.push(edge);
      byTarget.set(edge.to_language, list);
    }
    const targets: TranspileTarget[] = [];
    for (const [targetId, targetEdges] of byTarget) {
      const target = data.get(targetId);
      if (!target) continue;
      targets.push({
        nodeId: targetId,
        name: target.name,
        relationships: targetEdges.map(toRelationship),
      });
    }
    targets.sort((a, b) => a.name.localeCompare(b.name));
    datum.transpilesTo = targets;
  }

  // 5. Every candidate parent that is not the primary becomes a secondary
  //    relationship, so no edge is silently lost.
  for (const [childId, candidates] of candidatesByChild) {
    const datum = data.get(childId);
    if (!datum) continue;
    const primaryParentId = parentOf.get(childId);
    const rejected = cycleRejected.get(childId);

    const byParent = new Map<string, NormalizedEdge[]>();
    for (const edge of candidates) {
      if (edge.from_language === primaryParentId) continue;
      const list = byParent.get(edge.from_language) ?? [];
      list.push(edge);
      byParent.set(edge.from_language, list);
    }

    const secondaries: SecondaryParent[] = [];
    for (const [parentId, edges] of byParent) {
      const parent = data.get(parentId);
      if (!parent) continue;
      secondaries.push({
        nodeId: parentId,
        name: parent.name,
        relationships: edges.map(toRelationship),
        droppedForCycle: rejected?.has(parentId) ?? false,
      });
    }
    secondaries.sort((a, b) => a.name.localeCompare(b.name));
    datum.secondaryParents = secondaries;
  }

  // 6. Link children to parents; anything without a parent is a root.
  const roots: TreeNodeDatum[] = [];
  const sortedLanguages = [...dataset.languages].sort((a, b) => a.id.localeCompare(b.id));

  for (const lang of sortedLanguages) {
    const datum = data.get(lang.id)!;
    const parentId = parentOf.get(lang.id);
    if (parentId && data.has(parentId)) {
      data.get(parentId)!.children.push(datum);
    } else {
      roots.push(datum);
    }
  }

  // Order siblings by subtree size so the heavily-branching chains read first.
  const subtreeSize = new Map<string, number>();
  function measure(node: TreeNodeDatum): number {
    const cached = subtreeSize.get(node.id);
    if (cached !== undefined) return cached;
    let total = 1;
    for (const child of node.children) total += measure(child);
    subtreeSize.set(node.id, total);
    return total;
  }
  for (const root of roots) measure(root);

  function sortChildren(node: TreeNodeDatum): void {
    node.children.sort((a, b) => {
      const sizeDiff = (subtreeSize.get(b.id) ?? 1) - (subtreeSize.get(a.id) ?? 1);
      if (sizeDiff !== 0) return sizeDiff;
      return a.name.localeCompare(b.name);
    });
    for (const child of node.children) sortChildren(child);
  }
  for (const root of roots) sortChildren(root);

  roots.sort((a, b) => {
    const sizeDiff = (subtreeSize.get(b.id) ?? 1) - (subtreeSize.get(a.id) ?? 1);
    if (sizeDiff !== 0) return sizeDiff;
    return a.name.localeCompare(b.name);
  });

  return {
    root: { ...emptyRoot, children: roots },
    nodeCount: data.size,
    cycleBreaks,
  };
}
