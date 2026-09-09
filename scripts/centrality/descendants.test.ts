import { describe, expect, it } from 'vitest';
import { descendantsOf, transitiveDescendants } from './descendants';

describe('descendantsOf', () => {
  it('returns an empty set for a node with no outgoing edges', () => {
    expect(descendantsOf([], 'a')).toEqual(new Set());
  });

  it('follows a line graph transitively', () => {
    const edges = [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }];
    expect(descendantsOf(edges, 'a')).toEqual(new Set(['b', 'c']));
    expect(descendantsOf(edges, 'b')).toEqual(new Set(['c']));
    expect(descendantsOf(edges, 'c')).toEqual(new Set());
  });

  it('does not double-count a diamond', () => {
    const edges = [
      { from: 'a', to: 'b' },
      { from: 'a', to: 'c' },
      { from: 'b', to: 'd' },
      { from: 'c', to: 'd' },
    ];
    expect(descendantsOf(edges, 'a')).toEqual(new Set(['b', 'c', 'd']));
  });

  it('terminates on a cycle and never includes the start node itself', () => {
    const edges = [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }];
    expect(descendantsOf(edges, 'a')).toEqual(new Set(['b']));
  });

  it('handles a self-loop without infinite recursion', () => {
    const edges = [{ from: 'a', to: 'a' }, { from: 'a', to: 'b' }];
    expect(descendantsOf(edges, 'a')).toEqual(new Set(['b']));
  });
});

describe('transitiveDescendants', () => {
  it('computes descendant sets for every requested node from one shared adjacency', () => {
    const edges = [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }];
    const result = transitiveDescendants(edges, ['a', 'b', 'c']);
    expect(result.get('a')).toEqual(new Set(['b', 'c']));
    expect(result.get('b')).toEqual(new Set(['c']));
    expect(result.get('c')).toEqual(new Set());
  });
});
