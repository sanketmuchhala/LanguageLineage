import { describe, expect, it } from 'vitest';
import {
  allExpandableIds,
  collectDescendantIds,
  defaultCollapsedIds,
  dominantRelationship,
  findMatchingNodes,
  findPathToNode,
  formatYearRange,
  secondaryRelationshipCount,
} from './treeUtils';
import { VIRTUAL_ROOT_ID, type TreeNodeDatum, type TreeRelationship } from './treeTypes';

function n(id: string, children: TreeNodeDatum[] = []): TreeNodeDatum {
  return {
    id,
    name: id.replace(/^lang:/, ''),
    isVirtualRoot: id === VIRTUAL_ROOT_ID,
    selfHosted: false,
    selfHostRelationships: [],
    primaryRelationships: [],
    secondaryParents: [],
    transpilesTo: [],
    children,
  };
}

function rel(overrides: Partial<TreeRelationship> = {}): TreeRelationship {
  return {
    id: 'e',
    relationship: 'compiler_written_in',
    confidence: 0.9,
    start_year: null,
    end_year: null,
    evidence_source: 'test',
    notes: null,
    ...overrides,
  };
}

// root -> c -> go -> x, plus a detached "rust"
const tree = n(VIRTUAL_ROOT_ID, [
  n('lang:c', [n('lang:go', [n('lang:x')])]),
  n('lang:rust'),
]);

describe('findPathToNode', () => {
  it('returns the full path from root to target', () => {
    expect(findPathToNode(tree, 'lang:x')).toEqual([
      VIRTUAL_ROOT_ID,
      'lang:c',
      'lang:go',
      'lang:x',
    ]);
  });

  it('returns an empty path when the node is absent', () => {
    expect(findPathToNode(tree, 'lang:nope')).toEqual([]);
  });

  it('finds a direct child of the root', () => {
    expect(findPathToNode(tree, 'lang:rust')).toEqual([VIRTUAL_ROOT_ID, 'lang:rust']);
  });
});

describe('findMatchingNodes', () => {
  it('matches case-insensitively and skips the virtual root', () => {
    const matches = findMatchingNodes(tree, 'RUST');
    expect(matches.map((m) => m.id)).toEqual(['lang:rust']);
  });

  it('returns nothing for an empty query', () => {
    expect(findMatchingNodes(tree, '   ')).toEqual([]);
  });

  it('ranks an exact name match ahead of a longer partial match', () => {
    const t = n(VIRTUAL_ROOT_ID, [n('lang:go'), n('lang:googly')]);
    expect(findMatchingNodes(t, 'go')[0].id).toBe('lang:go');
  });
});

describe('collapse helpers', () => {
  it('collapses everything at or below the given depth', () => {
    // depth 0 = virtual root, 1 = c, 2 = go
    const collapsed = defaultCollapsedIds(tree, 2);
    expect(collapsed.has('lang:go')).toBe(true);
    expect(collapsed.has('lang:c')).toBe(false);
  });

  it('never collapses a leaf', () => {
    const collapsed = defaultCollapsedIds(tree, 0);
    expect(collapsed.has('lang:x')).toBe(false);
    expect(collapsed.has('lang:rust')).toBe(false);
  });

  it('lists every node that has children', () => {
    expect([...allExpandableIds(tree)].sort()).toEqual([
      VIRTUAL_ROOT_ID,
      'lang:c',
      'lang:go',
    ]);
  });

  it('collects all descendants', () => {
    const c = tree.children[0];
    expect(collectDescendantIds(c).sort()).toEqual(['lang:go', 'lang:x']);
  });
});

describe('relationship presentation', () => {
  it('picks the highest-confidence relationship as dominant', () => {
    const dom = dominantRelationship([
      rel({ relationship: 'compiler_written_in', confidence: 0.7 }),
      rel({ relationship: 'runtime_written_in', confidence: 0.95 }),
    ]);
    expect(dom).toBe('runtime_written_in');
  });

  it('returns null when there are no relationships', () => {
    expect(dominantRelationship([])).toBeNull();
  });

  it('formats year ranges', () => {
    expect(formatYearRange(rel({ start_year: 1983, end_year: 1990 }))).toBe('1983–1990');
    expect(formatYearRange(rel({ start_year: 2011, end_year: null }))).toBe('since 2011');
    expect(formatYearRange(rel({ start_year: null, end_year: 1999 }))).toBe('until 1999');
    expect(formatYearRange(rel())).toBeNull();
  });

  it('counts every edge across all secondary parents', () => {
    const node = n('lang:rust');
    node.secondaryParents = [
      { nodeId: 'lang:c', name: 'C', relationships: [rel(), rel()], droppedForCycle: false },
      { nodeId: 'lang:ocaml', name: 'OCaml', relationships: [rel()], droppedForCycle: false },
    ];
    expect(secondaryRelationshipCount(node)).toBe(3);
  });
});
