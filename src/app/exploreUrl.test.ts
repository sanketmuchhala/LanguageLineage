import { describe, it, expect } from 'vitest';
import { exploreUrl } from './exploreUrl';

describe('exploreUrl', () => {
  it('is plain /explore when nothing is selected or filtered', () => {
    expect(exploreUrl({ selectedNodeId: null, ai: false, aiOverlay: null })).toBe('/explore');
  });

  it('keeps the node deep link format', () => {
    expect(exploreUrl({ selectedNodeId: 'tool:triton', ai: false, aiOverlay: null })).toBe('/explore?node=tool%3Atriton');
  });

  it('writes the AI view and an overlaid path with its choices, as the /ai pages link them', () => {
    expect(exploreUrl({ selectedNodeId: null, ai: true, aiOverlay: null })).toBe('/explore?view=ai');
    expect(exploreUrl({ selectedNodeId: null, ai: true, aiOverlay: { slug: 'how-pytorch-runs', selection: { mode: 'compile', device: 'gpu' } } }))
      .toBe('/explore?view=ai&path=how-pytorch-runs&mode=compile&device=gpu');
  });

  it('keeps the AI view when a node is selected in it', () => {
    expect(exploreUrl({ selectedNodeId: 'tool:cuda', ai: true, aiOverlay: null })).toBe('/explore?node=tool%3Acuda&view=ai');
  });

  it('never writes a path without the AI view', () => {
    expect(exploreUrl({ selectedNodeId: null, ai: false, aiOverlay: { slug: 'how-jax-runs', selection: { mode: 'jit' } } })).toBe('/explore');
  });
});
