import { describe, expect, it } from 'vitest';
import { reversePageRank } from './pageRank';

const sum = (m: Map<string, number>) => [...m.values()].reduce((a, b) => a + b, 0);

describe('reversePageRank', () => {
  it('returns an empty map for no nodes', () => {
    expect(reversePageRank([], []).size).toBe(0);
  });

  it('gives every node equal rank when there are no edges', () => {
    const scores = reversePageRank([], ['a', 'b', 'c']);
    expect(scores.get('a')).toBeCloseTo(1 / 3, 10);
    expect(scores.get('b')).toBeCloseTo(1 / 3, 10);
    expect(scores.get('c')).toBeCloseTo(1 / 3, 10);
  });

  it('ranks the root of a line graph highest', () => {
    // a influenced b influenced c. Reversed, rank flows c -> b -> a, so a
    // (the ultimate root) should accumulate the most rank.
    const scores = reversePageRank(
      [{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }],
      ['a', 'b', 'c']
    );
    expect(scores.get('a')!).toBeGreaterThan(scores.get('b')!);
    expect(scores.get('b')!).toBeGreaterThan(scores.get('c')!);
  });

  it('ranks the shared root of a diamond highest', () => {
    // a influenced b and c; both b and c influenced d.
    const scores = reversePageRank(
      [
        { from: 'a', to: 'b' },
        { from: 'a', to: 'c' },
        { from: 'b', to: 'd' },
        { from: 'c', to: 'd' },
      ],
      ['a', 'b', 'c', 'd']
    );
    const ranked = [...scores.entries()].sort((x, y) => y[1] - x[1]).map(([id]) => id);
    expect(ranked[0]).toBe('a');
  });

  it('always sums to 1 across the full node set, including dangling nodes', () => {
    const scores = reversePageRank(
      [{ from: 'a', to: 'b' }],
      ['a', 'b', 'isolated']
    );
    expect(sum(scores)).toBeCloseTo(1, 6);
  });

  it('ignores edges referencing a node outside the given node set', () => {
    const scores = reversePageRank(
      [{ from: 'a', to: 'b' }, { from: 'ghost', to: 'a' }],
      ['a', 'b']
    );
    expect(scores.size).toBe(2);
    expect(sum(scores)).toBeCloseTo(1, 6);
  });

  it('terminates and stays normalized on a cycle', () => {
    const scores = reversePageRank(
      [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }],
      ['a', 'b']
    );
    expect(sum(scores)).toBeCloseTo(1, 6);
    expect(scores.get('a')).toBeCloseTo(scores.get('b')!, 6);
  });
});
