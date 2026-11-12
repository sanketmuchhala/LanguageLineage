/**
 * The explorer's AI infrastructure filter and "How it runs" links (src/data/aiExplainers.ts)
 * must follow the explainer files exactly: a tool is "AI" only because an explainer has a
 * stage linked to it, and the filter adds only what those tools are implemented in.
 */
import { describe, it, expect } from 'vitest';
import lineage from '../../dataset/v5/lineage_v5.json';
import { AI_EXPLAINERS, AI_TOOL_IDS, aiViewNodeIds, explainersFor } from './aiExplainers';
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

  it('adds only what the AI tools are implemented in, never influence neighbours', () => {
    const view = aiViewNodeIds(edges);
    for (const id of view) {
      if (AI_TOOL_IDS.has(id)) continue;
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
});
