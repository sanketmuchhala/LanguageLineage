import type { RelationshipType } from '../../data/types';
import type { TreeNodeDatum, TreeRelationship } from './treeTypes';

/** Matches the connector colours to the relationship legend already in tokens.css. */
export const RELATIONSHIP_COLOR_VAR: Record<RelationshipType, string> = {
  compiler_written_in: 'var(--rel-compiler)',
  runtime_written_in: 'var(--rel-runtime)',
  bootstrap_written_in: 'var(--rel-bootstrap)',
  rewritten_in: 'var(--rel-rewrite)',
  transpiled_to: 'var(--rel-transpile)',
  influenced: 'var(--rel-influence)',
  influenced_by: 'var(--rel-influence)',
};

export const RELATIONSHIP_LABEL: Record<RelationshipType, string> = {
  compiler_written_in: 'Compiler written in',
  runtime_written_in: 'Runtime written in',
  bootstrap_written_in: 'Bootstrapped from',
  rewritten_in: 'Rewritten in',
  transpiled_to: 'Transpiled to',
  influenced: 'Influenced',
  influenced_by: 'Influenced by',
};

/**
 * When several edges connect the same pair, one connector is drawn. This picks
 * which relationship colours it: the highest-confidence edge wins, so the line
 * reflects the strongest claim rather than an arbitrary one.
 */
export function dominantRelationship(rels: TreeRelationship[]): RelationshipType | null {
  if (rels.length === 0) return null;
  return [...rels].sort((a, b) => b.confidence - a.confidence)[0].relationship;
}

/** "1983–1990", "since 2011", or null when the edge carries no dates. */
export function formatYearRange(rel: TreeRelationship): string | null {
  if (rel.start_year === null && rel.end_year === null) return null;
  if (rel.start_year !== null && rel.end_year !== null) return `${rel.start_year}–${rel.end_year}`;
  if (rel.start_year !== null) return `since ${rel.start_year}`;
  return `until ${rel.end_year}`;
}

/** Every id from the root down to `targetId`, inclusive. Empty when not found. */
export function findPathToNode(root: TreeNodeDatum, targetId: string): string[] {
  const path: string[] = [];
  function walk(node: TreeNodeDatum): boolean {
    path.push(node.id);
    if (node.id === targetId) return true;
    for (const child of node.children) {
      if (walk(child)) return true;
    }
    path.pop();
    return false;
  }
  return walk(root) ? path : [];
}

/** Case-insensitive match on name or id, in tree order. */
export function findMatchingNodes(root: TreeNodeDatum, query: string): TreeNodeDatum[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matches: TreeNodeDatum[] = [];
  function walk(node: TreeNodeDatum): void {
    if (!node.isVirtualRoot) {
      if (node.name.toLowerCase().includes(q) || node.id.toLowerCase().includes(q)) {
        matches.push(node);
      }
    }
    for (const child of node.children) walk(child);
  }
  walk(root);
  // Exact name matches first so "rust" finds Rust before Rustc-adjacent names.
  matches.sort((a, b) => {
    const aExact = a.name.toLowerCase() === q ? 0 : 1;
    const bExact = b.name.toLowerCase() === q ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    return a.name.length - b.name.length;
  });
  return matches;
}

export function collectDescendantIds(node: TreeNodeDatum): string[] {
  const ids: string[] = [];
  for (const child of node.children) {
    ids.push(child.id);
    ids.push(...collectDescendantIds(child));
  }
  return ids;
}

/**
 * Ids to collapse for the initial view. The full tree is far too wide to open
 * at once, so everything below `depth` starts collapsed while the top of each
 * chain stays visible.
 */
export function defaultCollapsedIds(root: TreeNodeDatum, depth: number): Set<string> {
  const collapsed = new Set<string>();
  function walk(node: TreeNodeDatum, level: number): void {
    if (level >= depth && node.children.length > 0) collapsed.add(node.id);
    for (const child of node.children) walk(child, level + 1);
  }
  walk(root, 0);
  return collapsed;
}

/** All ids that have children, i.e. everything expandable. */
export function allExpandableIds(root: TreeNodeDatum): Set<string> {
  const ids = new Set<string>();
  function walk(node: TreeNodeDatum): void {
    if (node.children.length > 0) ids.add(node.id);
    for (const child of node.children) walk(child);
  }
  walk(root);
  return ids;
}

/** Every relationship the tree could not express structurally: extra parents
 *  plus transpilation targets. This is the number behind the "+N" badge. */
export function secondaryRelationshipCount(node: TreeNodeDatum): number {
  const parents = node.secondaryParents.reduce((sum, p) => sum + p.relationships.length, 0);
  const outputs = node.transpilesTo.reduce((sum, t) => sum + t.relationships.length, 0);
  return parents + outputs;
}

/** One human-readable line per hidden relationship, for the reveal panel. */
export function describeHiddenRelationships(node: TreeNodeDatum): string[] {
  const lines: string[] = [];
  for (const parent of node.secondaryParents) {
    for (const rel of parent.relationships) {
      const years = formatYearRange(rel);
      lines.push(
        `via ${parent.name} · ${RELATIONSHIP_LABEL[rel.relationship].toLowerCase()}` +
          `${years ? ` (${years})` : ''}${parent.droppedForCycle ? ' · cycle' : ''}`
      );
    }
  }
  for (const target of node.transpilesTo) {
    for (const rel of target.relationships) {
      const years = formatYearRange(rel);
      lines.push(`transpiles to ${target.name}${years ? ` (${years})` : ''}`);
    }
  }
  return lines;
}
