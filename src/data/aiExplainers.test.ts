/**
 * The explorer's AI infrastructure filter and "How it runs" links (src/data/aiExplainers.ts)
 * must follow the explainer files exactly: a tool is "AI" only because an explainer has a
 * stage linked to it, and the filter adds only what those tools are implemented in.
 */
import { describe, it, expect } from 'vitest';
import lineage from '../../dataset/v5/lineage_v5.json';
import { AI_EXPLAINERS, AI_TOOL_IDS, aiViewNodeIds, explainersFor, loadExplainer, overlayNodeIds, selectionFrom } from './aiExplainers';
import { allSelections } from './aiPathLogic';
import type { RawEdge } from './types';

interface PathFile { slug: string; stages: Array<{ lineage_id: string | null }> }
// Whole files, read independently of the module under test.
const files = Object.values(import.meta.glob<PathFile>('../../dataset/ai/*.json', { eager: true, import: 'default' }));
const nodeIds = new Set(lineage.languages.map((n) => n.id));
const edges = lineage.relationships as RawEdge[];

describe('AI explainers in the explorer', () => {
  it('lists every explainer file', () => {
    expect(AI_EXPLAINERS.map((e) => e.slug).sort()).toEqual(files.map((f) => f.slug).sort());
  });

  it('counts a tool as AI infrastructure exactly when an explainer stage links to it', () => {
    const expected = new Set(files.flatMap((f) => f.stages.map((s) => s.lineage_id)).filter((id): id is string => !!id && id.startsWith('tool:')));
    expect([...AI_TOOL_IDS].sort()).toEqual([...expected].sort());
    for (const id of AI_TOOL_IDS) expect(nodeIds.has(id), id).toBe(true);
  });

  it('shows every node an explainer stage links to, plus only what the AI tools are implemented in', () => {
    const view = aiViewNodeIds(edges);
    const staged = new Set(files.flatMap((f) => f.stages.map((s) => s.lineage_id)).filter((id): id is string => !!id));
    for (const id of staged) expect(view.has(id), id).toBe(true);
    for (const id of view) {
      if (staged.has(id)) continue;
      const implementsAi = edges.some((e) => e.from_language === id && AI_TOOL_IDS.has(e.to_language) && e.relationship !== 'influenced');
      expect(implementsAi, `${id} is in the AI view without an implementation edge into an AI tool`).toBe(true);
    }
    expect(view.has('lang:cxx')).toBe(true);
    expect(view.has('tool:pytorch')).toBe(true);
  });

  it('links a tool to every explainer that draws it', () => {
    expect(explainersFor('tool:triton').map((e) => e.slug).sort()).toEqual(
      files.filter((f) => f.stages.some((s) => s.lineage_id === 'tool:triton')).map((f) => f.slug).sort(),
    );
    expect(explainersFor('tool:gcc')).toEqual([]);
  });

  it('loads every explainer for the path overlay, and nothing for an unknown slug', async () => {
    for (const e of AI_EXPLAINERS) expect((await loadExplainer(e.slug))?.slug).toBe(e.slug);
    expect(await loadExplainer('not-a-page')).toBeNull();
  });

  it('overlays only atlas nodes on the selected path, in stage order, all inside the AI view', async () => {
    const view = aiViewNodeIds(edges);
    for (const e of AI_EXPLAINERS) {
      const data = (await loadExplainer(e.slug))!;
      for (const sel of allSelections(data)) {
        const ids = overlayNodeIds(data, sel);
        expect(ids.length, `${e.slug} ${JSON.stringify(sel)}`).toBeGreaterThan(0);
        for (const id of ids) {
          expect(nodeIds.has(id), id).toBe(true);
          expect(view.has(id), `${id} is overlaid but faded by the AI view`).toBe(true);
        }
      }
    }
    const pytorch = (await loadExplainer('how-pytorch-runs'))!;
    // torch.compile on a GPU, in the order the path visits the atlas nodes.
    expect(overlayNodeIds(pytorch, { mode: 'compile', device: 'gpu' })).toEqual(
      ['lang:python', 'tool:pytorch', 'tool:triton', 'tool:llvm', 'tool:cuda', 'lang:machine_code'],
    );
    expect(overlayNodeIds(pytorch, { mode: 'eager', device: 'cpu' })).not.toContain('tool:triton');
    // A request enters through vLLM before reaching the PyTorch model.
    const vllm = (await loadExplainer('how-vllm-runs'))!;
    expect(overlayNodeIds(vllm, { mode: 'eager', attention: 'flash' })).toEqual(['tool:vllm', 'tool:pytorch', 'tool:cuda']);
  });

  it('reads a selection from URL params, ignoring unknown values', async () => {
    const jax = (await loadExplainer('how-jax-runs'))!;
    expect(selectionFrom(jax, { mode: 'eager', device: 'tpu', extra: 'x' })).toEqual({ mode: 'eager', device: 'tpu' });
    expect(selectionFrom(jax, { mode: 'bogus' })).toEqual({ mode: 'jit', device: 'gpu' });
  });
});
