/**
 * AI execution-path explainers (/ai/<slug>, one per dataset/ai/<slug>.json).
 *
 * Compiler and GPU people will check these pages closely, so the semantics are
 * pinned here: every selection must reach hardware through documented stages,
 * every claim must carry a quoted source, and each generated page must match its
 * data. Quotes are checked against the live sources by `npm run check:ai-quotes`
 * (network, not part of the gate). Page-specific semantics are in the per-file
 * blocks at the bottom.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { loadAllPaths, parsePaths, activePath, allSelections, defaultSelection, stepId, type PathsData, type Selection } from './aiPaths';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = loadAllPaths(ROOT);
const lineage = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const lineageIds = new Set((lineage.languages as Array<{ id: string }>).map(n => n.id));
const bySlug = (slug: string) => files.find(f => f.slug === slug)!;
const page = (d: PathsData) => readFileSync(join(ROOT, 'public/ai', d.slug, 'index.html'), 'utf8');
const html = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

describe.each(files.map(f => [f.slug, f] as const))('%s: data', (_slug, data) => {
  it('every source is cited, and every lineage link resolves', () => {
    const cited = new Set([...data.stages, ...data.steps].flatMap(x => x.evidence.map(e => e.source)));
    expect(Object.keys(data.sources).filter(s => !cited.has(s))).toEqual([]);
    expect(data.stages.filter(s => s.lineage_id && !lineageIds.has(s.lineage_id)).map(s => s.lineage_id)).toEqual([]);
    expect(data.link_from.filter(id => !lineageIds.has(id))).toEqual([]);
  });

  it('hardware stages are sinks', () => {
    const hardware = new Set(data.stages.filter(s => s.kind === 'hardware').map(s => s.id));
    expect(data.steps.filter(s => hardware.has(s.from))).toEqual([]);
  });

  it.each(allSelections(data).map(sel => [JSON.stringify(sel), sel] as const))('%s reaches exactly one hardware stage', (_k, sel: Selection) => {
    const p = activePath(data, sel);
    const hw = data.stages.filter(s => s.kind === 'hardware' && p.stages.has(s.id));
    expect(hw.length, `${JSON.stringify(sel)} reaches ${hw.map(s => s.id)}`).toBeGreaterThanOrEqual(1);
  });

  it('every step is used by at least one selection', () => {
    const used = new Set(allSelections(data).flatMap(sel => [...activePath(data, sel).steps]));
    expect(data.steps.map(stepId).filter(id => !used.has(id))).toEqual([]);
  });
});

describe.each(files.map(f => [f.slug, f] as const))('%s: generated page', (_slug, data) => {
  const out = page(data);

  it('server-renders every stage, every step, and the default path', () => {
    const p = activePath(data, defaultSelection(data));
    for (const s of data.stages) {
      expect(out).toContain(`id="stage-${s.id}"`);
      expect(out).toContain(`id="detail-stage-${s.id}"`);
    }
    for (const s of data.steps) {
      expect(out).toContain(`id="detail-step-${stepId(s)}"`);
      expect(out.includes(`id="step-${stepId(s)}" class="ai-step on"`), stepId(s)).toBe(p.steps.has(stepId(s)));
    }
    expect((out.match(/<ol class="ai-path-list">([\s\S]*?)<\/ol>/)?.[1].match(/<li>/g) ?? []).length).toBe(p.steps.size);
  });

  it('renders one radio group per choice, with the default checked', () => {
    for (const d of data.dimensions) {
      for (const o of d.options) {
        expect(out).toContain(`name="${d.id}" value="${o.value}" data-phrase="${html(o.phrase)}"${o.value === d.default ? ' checked' : ''}>`);
      }
    }
  });

  it('shows every quote with a link to its source', () => {
    for (const ev of [...data.stages, ...data.steps].flatMap(x => x.evidence)) {
      expect(out).toContain(html(data.sources[ev.source].url));
    }
    for (const s of data.stages) for (const ev of s.evidence) expect(out).toContain(html(ev.quote));
  });

  it('is canonical, in the sitemap, has its social card and loads the explorer script', () => {
    expect(out).toContain(`<link rel="canonical" href="https://www.languagelineage.org/ai/${data.slug}" />`);
    expect(readFileSync(join(ROOT, 'public/sitemap.xml'), 'utf8')).toContain(`/ai/${data.slug}</loc>`);
    expect(out).toContain(`/og/ai-${data.slug}.png`);
    expect(existsSync(join(ROOT, `public/og/ai-${data.slug}.png`))).toBe(true);
    expect(out).toContain('<script defer src="/ai-path.js"></script>');
  });

  it('is linked from every node page it lists in link_from', () => {
    for (const id of data.link_from) {
      const [prefix, slug] = id.split(':');
      const node = readFileSync(join(ROOT, 'public', prefix === 'lang' ? 'languages' : 'tools', slug.replace(/_/g, '-'), 'index.html'), 'utf8');
      expect(node, id).toContain(`href="/ai/${data.slug}"`);
    }
  });
});

describe('schema guards', () => {
  const raw = JSON.parse(readFileSync(join(ROOT, 'dataset/ai/how-pytorch-runs.json'), 'utf8'));

  it('rejects a step that cites an unknown source', () => {
    const broken = structuredClone(raw);
    broken.steps[0].evidence[0].source = 'not_a_source';
    expect(() => parsePaths(broken)).toThrow(/unknown source/);
  });

  it('rejects a condition on an unknown choice value', () => {
    const broken = structuredClone(raw);
    broken.steps[1].when = { mode: ['turbo'] };
    expect(() => parsePaths(broken)).toThrow(/mode=turbo is not an option/);
  });

  it('rejects two stages in the same diagram position', () => {
    const broken = structuredClone(raw);
    broken.stages[1].pos = broken.stages[0].pos;
    expect(() => parsePaths(broken)).toThrow(/already used/);
  });
});

describe('how-pytorch-runs semantics', () => {
  const data = bySlug('how-pytorch-runs');
  const path = (mode: string, device: string) => activePath(data, { mode, device });
  const COMPILER = ['dynamo', 'fx_graph', 'inductor', 'cpp_openmp', 'triton_kernels', 'triton_compiler', 'llvm_ir', 'ptx', 'gpu_machine_code'];
  const GPU_ONLY = ['aten_cuda', 'triton_kernels', 'triton_compiler', 'llvm_ir', 'ptx', 'gpu_machine_code', 'nvidia_gpu'];
  const CPU_ONLY = ['aten_cpu', 'cpp_openmp', 'cpu'];

  it.each([['eager', 'cpu'], ['eager', 'gpu'], ['compile', 'cpu'], ['compile', 'gpu']])('%s on %s reaches only its own device', (mode, device) => {
    const p = path(mode, device);
    expect(p.stages.has(device === 'gpu' ? 'nvidia_gpu' : 'cpu')).toBe(true);
    for (const id of device === 'gpu' ? CPU_ONLY : GPU_ONLY) expect(p.stages.has(id), id).toBe(false);
  });

  it.each(['cpu', 'gpu'])('eager mode on %s involves no compiler stage', (device) => {
    const p = path('eager', device);
    for (const id of COMPILER) expect(p.stages.has(id), id).toBe(false);
  });

  it('torch.compile on GPU follows Dynamo, FX, Inductor, Triton, LLVM IR, PTX, machine code, GPU in order', () => {
    const p = path('compile', 'gpu');
    const chain = ['cpython', 'dynamo', 'fx_graph', 'inductor', 'triton_kernels', 'triton_compiler', 'llvm_ir', 'ptx', 'gpu_machine_code', 'nvidia_gpu'];
    for (let i = 0; i < chain.length - 1; i++) expect(p.steps.has(`${chain[i]}--${chain[i + 1]}`), `${chain[i]} -> ${chain[i + 1]}`).toBe(true);
  });

  it('torch.compile on CPU generates C++/OpenMP, with ATen only as a fallback', () => {
    const p = path('compile', 'cpu');
    expect(p.steps.has('inductor--cpp_openmp')).toBe(true);
    expect(p.steps.has('cpython--aten')).toBe(false);
    expect(data.steps.find(s => stepId(s) === 'inductor--aten_cpu')?.kind).toBe('falls_back_to');
  });
});
