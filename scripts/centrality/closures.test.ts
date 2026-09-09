import { describe, expect, it } from 'vitest';
import { implementationClosure } from './closures';

describe('implementationClosure', () => {
  it('includes the root itself even with no descendants', () => {
    expect(implementationClosure([], ['c'])).toEqual(new Set(['c']));
  });

  it('includes everything descended from a single root', () => {
    const edges = [{ from: 'c', to: 'go' }, { from: 'go', to: 'docker' }];
    expect(implementationClosure(edges, ['c'])).toEqual(new Set(['c', 'go', 'docker']));
  });

  it('unions descendants across multiple roots without duplicating', () => {
    // Mirrors the real case: closure(C) union closure(C++).
    const edges = [
      { from: 'c', to: 'python' },
      { from: 'cxx', to: 'rust' },
      { from: 'python', to: 'boto' },
    ];
    const closure = implementationClosure(edges, ['c', 'cxx']);
    expect(closure).toEqual(new Set(['c', 'cxx', 'python', 'rust', 'boto']));
  });

  it('does not count a node as its own descendant through a root that is also downstream of it', () => {
    const edges = [{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }];
    expect(implementationClosure(edges, ['a'])).toEqual(new Set(['a', 'b']));
  });
});
