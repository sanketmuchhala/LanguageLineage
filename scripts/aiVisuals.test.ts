/**
 * /ai hub visuals (scripts/aiVisuals.ts). They summarise dataset/ai/*.json and the
 * lineage edges; these tests pin that every mark on them traces back to a documented
 * path, so a data change cannot quietly draw a connection the explainers do not make.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { loadAllPaths, activePath, allSelections, defaultSelection } from './aiPaths';
import { buildConvergenceModel, buildAnatomy, buildLanguageMatrix, orderedPath, hardwareTarget, NO_SHARED_TOOL, type NodeInfo, type LineageRel } from './aiVisuals';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = loadAllPaths(ROOT);
const lineage = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const names = new Map<string, string>((lineage.languages as Array<{ id: string; name: string }>).map(n => [n.id, n.name]));
const rels = lineage.relationships as LineageRel[];
const info: NodeInfo = { name: id => names.get(id) ?? id, href: id => `/x/${id}`, exists: id => names.has(id) };
const model = buildConvergenceModel(pages, info);
const hub = readFileSync(join(ROOT, 'public/ai/index.html'), 'utf8');

describe('convergence map', () => {
  it('has one path per selectable selection of every explainer', () => {
    expect(model.paths.length).toBe(pages.reduce((n, p) => n + allSelections(p).length, 0));
  });

  it('middle column holds only atlas tools that at least two explainers link to', () => {
    for (const id of model.sharedTools) {
      const users = pages.filter(p => p.stages.some(s => s.lineage_id === id));
      expect(users.length, id).toBeGreaterThanOrEqual(2);
    }
  });

  it('every path reaches each of its hardware targets through some middle node', () => {
    for (const p of model.paths) {
      const linked = new Set(model.links.filter(l => l.tokens.includes(p.token) && l.to.startsWith('hw:')).map(l => l.to.slice(3)));
      expect([...linked].sort(), p.token).toEqual([...p.hardware].sort());
    }
  });

  it('a tool links only to hardware its own stages lead to (CUDA never to CPU)', () => {
    const cudaHw = model.links.filter(l => l.from === 'tool:cuda').map(l => l.to);
    expect(cudaHw).toEqual(['hw:NVIDIA GPU']);
  });

  it('hardware targets group NVIDIA, AMD, Apple, TPU and CPU stages across files', () => {
    expect(hardwareTarget({ name: 'NVIDIA GPU (Hopper)' })).toBe('NVIDIA GPU');
    expect(hardwareTarget({ name: 'Apple silicon GPU' })).toBe('Apple silicon GPU');
    expect(hardwareTarget({ name: 'x86-64 CPU' })).toBe('CPU');
  });

  it('is server-rendered with a node per framework, shared tool and chip', () => {
    for (const n of model.nodes) expect(hub, n.id).toContain(`data-tokens="${n.tokens.join(' ')}"`);
    expect(hub).toContain('<script defer src="/ai-hub.js"></script>');
  });

  it('marks paths with no shared tool on the way to a chip', () => {
    const none = model.nodes.find(n => n.id === NO_SHARED_TOOL);
    if (none) for (const t of none.tokens) expect(model.paths.find(p => p.token === t)!.reach[NO_SHARED_TOOL]?.length).toBeGreaterThan(0);
  });
});

describe('path anatomy', () => {
  const rows = buildAnatomy(pages);

  it.each(pages.map(p => [p.slug, p] as const))('%s: default path in execution order, ending on hardware', (_s, p) => {
    const { main: order, side } = orderedPath(p, defaultSelection(p));
    expect([...order, ...side].map(s => s.id).sort()).toEqual([...activePath(p, defaultSelection(p)).stages].sort());
    expect(order[0].id).toBe(p.stages[0].id);
    // The main chain ends on hardware, and side stages never include hardware.
    expect(order[order.length - 1].kind).toBe('hardware');
    expect(side.filter(s => s.kind === 'hardware')).toEqual([]);
    expect(order.findIndex(s => s.kind === 'hardware')).toBeGreaterThan(0);
  });

  it('keeps the SGLang detokenizer and Transformers post-processing off the main chain', () => {
    const side = (slug: string) => rows.find(r => r.slug === slug)!.side.map(s => s.id);
    expect(side('how-sglang-runs')).toContain('detokenizer');
    expect(side('how-transformers-runs')).toContain('postprocess');
  });

  it('hands over after the user code layers', () => {
    for (const r of rows) {
      expect(['python', 'application']).not.toContain(r.stages[r.handoff].layer);
      expect(r.stages.slice(0, r.handoff).every(s => ['python', 'application'].includes(s.layer))).toBe(true);
    }
  });
});

describe('language matrix', () => {
  const m = buildLanguageMatrix(pages, rels, info);

  it('every dot is a current compiler or runtime edge into a tool on that explainer', () => {
    for (const row of m.rows) for (const [lang, tools] of row.cells) for (const tool of tools) {
      const toolId = [...names].find(([, n]) => n === tool)![0];
      const edge = rels.find(r => r.from_language === lang && r.to_language === toolId && r.end_year == null
        && (r.relationship === 'compiler_written_in' || r.relationship === 'runtime_written_in'));
      expect(edge, `${row.slug}: ${lang} -> ${tool}`).toBeTruthy();
    }
  });

  it('is rendered as an accessible table', () => {
    expect(hub).toContain('<table id="ai-language-matrix"');
    for (const row of m.rows) expect(hub).toContain(`<th scope="row"><a href="/ai/${row.slug}">`);
  });
});
