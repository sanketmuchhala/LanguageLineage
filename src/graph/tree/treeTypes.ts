import type { ClusterType, RelationshipType } from '../../data/types';

/** The synthetic root. The dataset has no single natural root, so one is created
 *  to hang every real root node and disconnected component off. */
export const VIRTUAL_ROOT_ID = '__root__';
export const VIRTUAL_ROOT_NAME = 'Programming Languages';

/** Relationship types that describe "X was built with Y", where `from_language`
 *  is the builder. These are the only edges allowed to shape the hierarchy. */
export const PARENT_RELATIONSHIPS: RelationshipType[] = [
  'compiler_written_in',
  'runtime_written_in',
  'bootstrap_written_in',
  'rewritten_in',
];

/** `transpiled_to` runs the other way: `from_language` is the SOURCE being
 *  compiled and `to_language` is the OUTPUT. Using it as a parent edge would
 *  claim "C was built with V" from "V transpiles to C", so it never shapes the
 *  tree. It is preserved on the source node as outgoing information instead. */
export const OUTPUT_RELATIONSHIPS: RelationshipType[] = ['transpiled_to'];

/** One edge, flattened to what the tree needs to render and explain it. */
export interface TreeRelationship {
  id: string;
  relationship: RelationshipType;
  confidence: number;
  start_year: number | null;
  end_year: number | null;
  evidence_source: string;
  notes?: string | null;
}

/** A parent that lost the primary-parent contest but is still a real
 *  relationship. Surfaced as "+N relationships" rather than duplicating subtrees. */
export interface SecondaryParent {
  nodeId: string;
  name: string;
  /** All edges between this parent and the child, combined so the tree never
   *  draws two lines between the same pair. */
  relationships: TreeRelationship[];
  /** True when the link was dropped to keep the hierarchy acyclic, rather than
   *  simply losing on confidence. */
  droppedForCycle: boolean;
}

/** A transpilation target: "V transpiles to C", recorded on V. */
export interface TranspileTarget {
  nodeId: string;
  name: string;
  relationships: TreeRelationship[];
}

export interface TreeNodeDatum {
  id: string;
  name: string;
  isVirtualRoot: boolean;
  /** Self-referential edges are never rendered as a child of themselves; they
   *  become a badge on the node instead. */
  selfHosted: boolean;
  selfHostRelationships: TreeRelationship[];
  /** Edges from the chosen primary parent to this node, combined. Empty for
   *  roots and the virtual root. */
  primaryRelationships: TreeRelationship[];
  secondaryParents: SecondaryParent[];
  /** Languages this one compiles into. Not parents, not children. */
  transpilesTo: TranspileTarget[];
  children: TreeNodeDatum[];
  cluster?: ClusterType;
  firstReleaseYear?: number;
  degree?: number;
}

export interface HierarchyResult {
  root: TreeNodeDatum;
  /** Real nodes placed in the tree, excluding the virtual root. */
  nodeCount: number;
  /** Parent links demoted to secondary because accepting them would have
   *  created a cycle. Kept for diagnostics and tests. */
  cycleBreaks: Array<{ childId: string; parentId: string }>;
}

export interface BuildHierarchyOptions {
  relationshipFilters: Record<string, boolean>;
  confidenceThreshold: number;
  /** The tree only models implementation. In influence mode it renders empty
   *  rather than pretending influence edges are a build hierarchy. */
  graphMode: 'implementation' | 'influence';
}

/** Imperative handle the tree exposes so the shared navigation controls can
 *  drive it the same way they drive Cytoscape. */
export interface TreeController {
  fit: () => void;
  reset: () => void;
  centerOnNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}
