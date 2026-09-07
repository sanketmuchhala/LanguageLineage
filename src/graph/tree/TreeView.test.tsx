// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { cleanup, render } from '@testing-library/react';
import { TreeView } from './TreeView';
import { useGraphStore } from '../../store/useGraphStore';
import type {
  NormalizedDataset,
  NormalizedEdge,
  NormalizedLanguageNode,
} from '../../data/types';

function node(id: string): NormalizedLanguageNode {
  return {
    id,
    name: id.replace(/^lang:/, ''),
    first_release_year: 1990,
    current_primary_implementation_language: 'unspecified',
    notes: null,
    degree: 1,
    cluster: 'other',
  };
}

function edge(from: string, to: string): NormalizedEdge {
  return {
    id: `${from}->${to}`,
    from_language: from,
    to_language: to,
    relationship: 'compiler_written_in',
    start_year: null,
    end_year: null,
    confidence: 0.9,
    evidence_source: 'test',
    notes: null,
  };
}

const languages = [node('lang:c'), node('lang:go'), node('lang:rust'), node('lang:zig')];
const edges = [
  edge('lang:c', 'lang:go'),
  edge('lang:c', 'lang:rust'),
  edge('lang:go', 'lang:zig'),
];

const dataset: NormalizedDataset = {
  languages,
  implementations: [],
  edges,
  languageMap: new Map(languages.map((l) => [l.id, l])),
  edgeMap: new Map(edges.map((e) => [e.id, e])),
};

// jsdom has no matchMedia. Reporting reduced motion makes d3 transitions
// zero-duration, so exits settle within one timer tick and assertions are
// deterministic. It also exercises the reduced-motion path.
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  act(() => {
    useGraphStore.getState().setDataset(dataset);
  });
});

/** With reduced motion stubbed on, the render is synchronous; this only lets
 *  React flush any queued effects. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

afterEach(() => {
  cleanup();
  act(() => {
    useGraphStore.getState().setTreeController(null);
    useGraphStore.getState().setSelectedNode(null);
  });
});

describe('TreeView mounting', () => {
  it('collapses below the initial depth instead of rendering the whole tree', async () => {
    const { container } = render(<TreeView />);
    await flush();
    const labels = [...container.querySelectorAll('text.tree-node-label')].map(
      (e) => e.textContent
    );
    // c -> go -> zig: zig sits below the initial depth and stays collapsed.
    expect(labels).toContain('c');
    expect(labels).toContain('go');
    expect(labels).toContain('rust');
    expect(labels).not.toContain('zig');
  });

  it('registers a tree controller while mounted and clears it on unmount', () => {
    const { unmount } = render(<TreeView />);
    expect(useGraphStore.getState().treeController).not.toBeNull();

    act(() => {
      unmount();
    });
    expect(useGraphStore.getState().treeController).toBeNull();
  });

  it('does not accumulate SVG elements across repeated mount/unmount cycles', () => {
    const counts: number[] = [];

    for (let i = 0; i < 5; i++) {
      const { container, unmount } = render(<TreeView />);
      counts.push(container.querySelectorAll('g.tree-node').length);
      act(() => {
        unmount();
      });
      // Nothing from this cycle may survive into the document.
      expect(document.querySelectorAll('g.tree-node').length).toBe(0);
    }

    // Every mount produced exactly the same element count: no leak, no growth.
    expect(new Set(counts).size).toBe(1);
    expect(counts[0]).toBeGreaterThan(0);
  });

  it('leaves no SVG behind in the document after unmount', () => {
    const { unmount } = render(<TreeView />);
    expect(document.querySelectorAll('svg.tree-svg').length).toBe(1);
    act(() => {
      unmount();
    });
    expect(document.querySelectorAll('svg.tree-svg').length).toBe(0);
  });

  it('renders the empty state in influence mode', () => {
    act(() => {
      useGraphStore.getState().updateFilters({ graphMode: 'influence' });
    });
    const { container } = render(<TreeView />);
    expect(container.querySelector('.tree-empty')).not.toBeNull();
    expect(container.querySelectorAll('g.tree-node').length).toBe(0);

    act(() => {
      useGraphStore.getState().updateFilters({ graphMode: 'implementation' });
    });
  });

  it('rebuilds when relationship filters change', async () => {
    const { container } = render(<TreeView />);
    await flush();
    expect(container.querySelectorAll('path.tree-link').length).toBeGreaterThan(0);

    act(() => {
      useGraphStore.getState().updateFilters({
        relationshipFilters: {
          ...useGraphStore.getState().filters.relationshipFilters,
          compiler_written_in: false,
        },
      });
    });
    await flush();

    // Every edge is gone, so every language becomes a root: no connectors left,
    // and the previously hidden node is now visible as a root of its own.
    expect(container.querySelectorAll('path.tree-link').length).toBe(0);
    const labels = [...container.querySelectorAll('text.tree-node-label')].map(
      (e) => e.textContent
    );
    expect(labels).toContain('zig');

    act(() => {
      useGraphStore.getState().resetFilters();
    });
  });
});
