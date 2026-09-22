import { describe, expect, it } from 'vitest';
import { buildHierarchy } from './buildHierarchy';
import { VIRTUAL_ROOT_ID, type TreeNodeDatum } from './treeTypes';
import type {
  NormalizedDataset,
  NormalizedEdge,
  NormalizedLanguageNode,
  RelationshipType,
} from '../../data/types';

// ---- fixtures --------------------------------------------------------------

function node(id: string, overrides: Partial<NormalizedLanguageNode> = {}): NormalizedLanguageNode {
  return {
    id,
    name: id.replace(/^(lang|tool):/, ''),
    first_release_year: 1990,
    current_primary_implementation_language: 'unspecified',
    notes: null,
    degree: 0,
    cluster: 'other',
    ...overrides,
  };
}

function edge(
  from: string,
  to: string,
  relationship: RelationshipType = 'compiler_written_in',
  overrides: Partial<NormalizedEdge> = {}
): NormalizedEdge {
  return {
    id: `${from}->${to}:${relationship}`,
    from_language: from,
    to_language: to,
    relationship,
    start_year: null,
    end_year: null,
    confidence: 0.9,
    evidence_source: 'test',
    notes: null,
    ...overrides,
  };
}

function dataset(languages: NormalizedLanguageNode[], edges: NormalizedEdge[]): NormalizedDataset {
  return {
    languages,
    implementations: [],
    edges,
    languageMap: new Map(languages.map((l) => [l.id, l])),
    edgeMap: new Map(edges.map((e) => [e.id, e])),
  };
}

const ALL_ON = {
  compiler_written_in: true,
  runtime_written_in: true,
  bootstrap_written_in: true,
  rewritten_in: true,
  influenced: true,
  influenced_by: true,
  transpiled_to: true,
};

const OPTS = {
  relationshipFilters: ALL_ON,
  confidenceThreshold: 0,
  graphMode: 'implementation' as const,
};

function findNode(root: TreeNodeDatum, id: string): TreeNodeDatum | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

function childIds(node: TreeNodeDatum): string[] {
  return node.children.map((c) => c.id);
}

// ---- tests -----------------------------------------------------------------

describe('buildHierarchy — basic parent/child', () => {
  it('places the implementing language as the parent of what it built', () => {
    const ds = dataset(
      [node('lang:c'), node('lang:go')],
      [edge('lang:c', 'lang:go')]
    );
    const { root, nodeCount } = buildHierarchy(ds, OPTS);

    expect(root.id).toBe(VIRTUAL_ROOT_ID);
    expect(nodeCount).toBe(2);
    expect(childIds(root)).toEqual(['lang:c']);
    expect(childIds(findNode(root, 'lang:c')!)).toEqual(['lang:go']);
  });

  it('keeps a chain intact across several levels', () => {
    const ds = dataset(
      [node('lang:c'), node('lang:go'), node('lang:x')],
      [edge('lang:c', 'lang:go'), edge('lang:go', 'lang:x')]
    );
    const { root } = buildHierarchy(ds, OPTS);
    const go = findNode(root, 'lang:go')!;
    expect(childIds(go)).toEqual(['lang:x']);
  });
});

describe('buildHierarchy — multiple parents', () => {
  it('picks the highest-confidence parent and demotes the rest', () => {
    const ds = dataset(
      [node('lang:c'), node('lang:ocaml'), node('lang:rust')],
      [
        edge('lang:c', 'lang:rust', 'compiler_written_in', { confidence: 0.85 }),
        edge('lang:ocaml', 'lang:rust', 'compiler_written_in', { confidence: 0.95 }),
      ]
    );
    const { root } = buildHierarchy(ds, OPTS);

    expect(childIds(findNode(root, 'lang:ocaml')!)).toEqual(['lang:rust']);
    const rust = findNode(root, 'lang:rust')!;
    expect(rust.secondaryParents.map((p) => p.nodeId)).toEqual(['lang:c']);
    // The node appears exactly once; the tree is not duplicated per parent.
    expect(findNode(root, 'lang:c')!.children).toHaveLength(0);
  });

  it('breaks a confidence tie in favour of the still-active relationship', () => {
    const ds = dataset(
      [node('lang:ocaml'), node('tool:llvm'), node('lang:rust')],
      [
        edge('lang:ocaml', 'lang:rust', 'compiler_written_in', {
          confidence: 0.95,
          start_year: 2010,
          end_year: 2011,
        }),
        edge('tool:llvm', 'lang:rust', 'compiler_written_in', {
          confidence: 0.95,
          start_year: 2011,
          end_year: null,
        }),
      ]
    );
    const { root } = buildHierarchy(ds, OPTS);
    expect(childIds(findNode(root, 'tool:llvm')!)).toEqual(['lang:rust']);
  });

  it('falls back to the most recent relationship when confidence and activity tie', () => {
    const ds = dataset(
      [node('lang:a'), node('lang:b'), node('lang:z')],
      [
        edge('lang:a', 'lang:z', 'compiler_written_in', { confidence: 0.9, start_year: 1990 }),
        edge('lang:b', 'lang:z', 'compiler_written_in', { confidence: 0.9, start_year: 2005 }),
      ]
    );
    const { root } = buildHierarchy(ds, OPTS);
    expect(childIds(findNode(root, 'lang:b')!)).toEqual(['lang:z']);
  });

  it('combines several edges between the same pair instead of duplicating', () => {
    const ds = dataset(
      [node('lang:c'), node('lang:py')],
      [
        edge('lang:c', 'lang:py', 'compiler_written_in', { confidence: 0.9 }),
        edge('lang:c', 'lang:py', 'runtime_written_in', { confidence: 0.9 }),
      ]
    );
    const { root } = buildHierarchy(ds, OPTS);
    const c = findNode(root, 'lang:c')!;
    expect(childIds(c)).toEqual(['lang:py']);
    expect(findNode(root, 'lang:py')!.primaryRelationships).toHaveLength(2);
  });
});

describe('buildHierarchy — self-hosting', () => {
  it('never renders a node as its own child', () => {
    const ds = dataset(
      [node('lang:rust')],
      [edge('lang:rust', 'lang:rust', 'compiler_written_in', { confidence: 0.98 })]
    );
    const { root } = buildHierarchy(ds, OPTS);
    const rust = findNode(root, 'lang:rust')!;

    expect(rust.children).toHaveLength(0);
    expect(rust.selfHosted).toBe(true);
    expect(rust.selfHostRelationships).toHaveLength(1);
  });

  it('keeps a self-hosting node in the tree under its real parent', () => {
    const ds = dataset(
      [node('lang:ocaml'), node('lang:rust')],
      [
        edge('lang:ocaml', 'lang:rust', 'compiler_written_in', { confidence: 0.95 }),
        edge('lang:rust', 'lang:rust', 'compiler_written_in', { confidence: 0.98 }),
      ]
    );
    const { root } = buildHierarchy(ds, OPTS);
    expect(childIds(findNode(root, 'lang:ocaml')!)).toEqual(['lang:rust']);
    expect(findNode(root, 'lang:rust')!.selfHosted).toBe(true);
  });

  it('honours the self_hosting node flag even without a self edge', () => {
    const ds = dataset([node('lang:go', { self_hosting: true })], []);
    const { root } = buildHierarchy(ds, OPTS);
    expect(findNode(root, 'lang:go')!.selfHosted).toBe(true);
  });
});

describe('buildHierarchy — cycles', () => {
  it('breaks a two-node cycle and keeps both nodes exactly once', () => {
    const ds = dataset(
      [node('lang:a'), node('lang:b')],
      [
        edge('lang:a', 'lang:b', 'compiler_written_in', { confidence: 0.9 }),
        edge('lang:b', 'lang:a', 'compiler_written_in', { confidence: 0.9 }),
      ]
    );
    const { root, cycleBreaks } = buildHierarchy(ds, OPTS);

    const all: string[] = [];
    (function walk(n: TreeNodeDatum) {
      if (!n.isVirtualRoot) all.push(n.id);
      n.children.forEach(walk);
    })(root);

    expect(all.sort()).toEqual(['lang:a', 'lang:b']);
    expect(cycleBreaks.length).toBeGreaterThan(0);
  });

  it('preserves the dropped edge as a secondary relationship', () => {
    const ds = dataset(
      [node('lang:a'), node('lang:b')],
      [
        edge('lang:a', 'lang:b', 'compiler_written_in', { confidence: 0.9 }),
        edge('lang:b', 'lang:a', 'compiler_written_in', { confidence: 0.9 }),
      ]
    );
    const { root } = buildHierarchy(ds, OPTS);
    const withSecondary = [findNode(root, 'lang:a')!, findNode(root, 'lang:b')!].filter(
      (n) => n.secondaryParents.length > 0
    );
    expect(withSecondary).toHaveLength(1);
    expect(withSecondary[0].secondaryParents[0].droppedForCycle).toBe(true);
  });

  it('breaks a three-node cycle', () => {
    const ds = dataset(
      [node('lang:a'), node('lang:b'), node('lang:c')],
      [
        edge('lang:a', 'lang:b'),
        edge('lang:b', 'lang:c'),
        edge('lang:c', 'lang:a'),
      ]
    );
    const { root } = buildHierarchy(ds, OPTS);
    let count = 0;
    (function walk(n: TreeNodeDatum) {
      if (!n.isVirtualRoot) count++;
      n.children.forEach(walk);
    })(root);
    expect(count).toBe(3);
  });
});

describe('buildHierarchy — roots and disconnected nodes', () => {
  it('hangs disconnected nodes off the virtual root', () => {
    const ds = dataset([node('lang:lonely'), node('lang:other')], []);
    const { root } = buildHierarchy(ds, OPTS);
    expect(childIds(root).sort()).toEqual(['lang:lonely', 'lang:other']);
  });

  it('returns an empty virtual root for an empty dataset', () => {
    const { root, nodeCount } = buildHierarchy(dataset([], []), OPTS);
    expect(root.id).toBe(VIRTUAL_ROOT_ID);
    expect(root.children).toHaveLength(0);
    expect(nodeCount).toBe(0);
  });

  it('handles a null dataset', () => {
    const { root, nodeCount } = buildHierarchy(null, OPTS);
    expect(root.isVirtualRoot).toBe(true);
    expect(nodeCount).toBe(0);
  });

  it('ignores edges pointing at nodes that do not exist', () => {
    const ds = dataset([node('lang:c')], [edge('lang:c', 'lang:ghost')]);
    const { root } = buildHierarchy(ds, OPTS);
    expect(childIds(findNode(root, 'lang:c')!)).toEqual([]);
  });
});

describe('buildHierarchy — filtering', () => {
  it('drops a relationship type when its filter is off', () => {
    const ds = dataset(
      [node('lang:c'), node('lang:py')],
      [edge('lang:c', 'lang:py', 'runtime_written_in')]
    );
    const { root } = buildHierarchy(ds, {
      ...OPTS,
      relationshipFilters: { ...ALL_ON, runtime_written_in: false },
    });
    // Both nodes survive, but py is now a root rather than a child of c.
    expect(childIds(root).sort()).toEqual(['lang:c', 'lang:py']);
  });

  it('re-parents to the next-best edge when the best one is filtered out', () => {
    const ds = dataset(
      [node('lang:c'), node('lang:ocaml'), node('lang:rust')],
      [
        edge('lang:ocaml', 'lang:rust', 'runtime_written_in', { confidence: 0.99 }),
        edge('lang:c', 'lang:rust', 'compiler_written_in', { confidence: 0.8 }),
      ]
    );
    const { root } = buildHierarchy(ds, {
      ...OPTS,
      relationshipFilters: { ...ALL_ON, runtime_written_in: false },
    });
    expect(childIds(findNode(root, 'lang:c')!)).toEqual(['lang:rust']);
  });

  it('applies the confidence threshold', () => {
    const ds = dataset(
      [node('lang:c'), node('lang:py')],
      [edge('lang:c', 'lang:py', 'compiler_written_in', { confidence: 0.5 })]
    );
    const { root } = buildHierarchy(ds, { ...OPTS, confidenceThreshold: 0.8 });
    expect(childIds(root).sort()).toEqual(['lang:c', 'lang:py']);
  });

  it('excludes influence edges from the implementation hierarchy', () => {
    const ds = dataset(
      [node('lang:a'), node('lang:b')],
      [edge('lang:a', 'lang:b', 'influenced', { confidence: 1 })]
    );
    const { root } = buildHierarchy(ds, OPTS);
    expect(childIds(root).sort()).toEqual(['lang:a', 'lang:b']);
  });

  it('renders nothing in influence mode', () => {
    const ds = dataset([node('lang:c'), node('lang:go')], [edge('lang:c', 'lang:go')]);
    const { root, nodeCount } = buildHierarchy(ds, { ...OPTS, graphMode: 'influence' });
    expect(root.children).toHaveLength(0);
    expect(nodeCount).toBe(0);
  });
});

describe('buildHierarchy — determinism', () => {
  it('produces an identical tree across repeated builds', () => {
    const ds = dataset(
      [node('lang:a'), node('lang:b'), node('lang:c'), node('lang:d')],
      [
        edge('lang:a', 'lang:c', 'compiler_written_in', { confidence: 0.9 }),
        edge('lang:b', 'lang:c', 'compiler_written_in', { confidence: 0.9 }),
        edge('lang:c', 'lang:d'),
      ]
    );
    const first = JSON.stringify(buildHierarchy(ds, OPTS).root);
    const second = JSON.stringify(buildHierarchy(ds, OPTS).root);
    expect(first).toBe(second);
  });
});
