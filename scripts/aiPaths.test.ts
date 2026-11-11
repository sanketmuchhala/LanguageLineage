/**
 * The PyTorch execution-path explainer (/ai/how-pytorch-runs).
 *
 * Compiler and GPU people will check this page closely, so the semantics are
 * pinned here: each mode/device selection must reach the right hardware through
 * the documented stages and nothing else, every claim must carry a quoted source,
 * and the generated page must match the data. Quotes are checked against the live
 * sources by `npm run check:ai-quotes` (network, not part of the gate).
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { parsePaths, activePath, stepId, MODES, DEVICES, LAYOUT, type Mode, type Device } from './aiPaths';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(readFileSync(join(ROOT, 'dataset/ai/pytorch_execution_paths.json'), 'utf8'));
const data = parsePaths(raw);
const lineage = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const lineageIds = new Set((lineage.languages as Array<{ id: string }>).map(n => n.id));
const configs: Array<[Mode, Device]> = MODES.flatMap(m => DEVICES.map(d => [m, d] as [Mode, Device]));
const COMPILER_STAGES = ['dynamo', 'fx_graph', 'inductor', 'cpp_openmp', 'triton_kernels', 'triton_compiler', 'llvm_ir', 'ptx', 'gpu_machine_code'];
const GPU_ONLY = ['aten_cuda', 'triton_kernels', 'triton_compiler', 'llvm_ir', 'ptx', 'gpu_machine_code', 'nvidia_gpu'];
const CPU_ONLY = ['aten_cpu', 'cpp_openmp', 'cpu'];

describe('execution-path data', () => {
  it('parses against the schema', () => {
    expect(data.stages.length).toBeGreaterThan(5);
  });

  it('rejects a step that cites an unknown source', () => {
    const broken = structuredClone(raw);
    broken.steps[0].evidence[0].source = 'not_a_source';
    expect(() => parsePaths(broken)).toThrow(/unknown source/);
  });

  it('every source is cited at least once and every quote is substantial', () => {
    const cited = new Set([...data.stages, ...data.steps].flatMap(x => x.evidence.map(e => e.source)));
    expect([...Object.keys(data.sources)].filter(s => !cited.has(s))).toEqual([]);
  });

  it('links stages only to nodes that exist in the lineage dataset', () => {
    const bad = data.stages.filter(s => s.lineage_id && !lineageIds.has(s.lineage_id)).map(s => s.lineage_id);
    expect(bad).toEqual([]);
  });

  it('has a diagram position for every stage, and hardware stages are sinks', () => {
    for (const s of data.stages) expect(LAYOUT[s.id], s.id).toBeDefined();
    const hardware = new Set(data.stages.filter(s => s.kind === 'hardware').map(s => s.id));
    expect(data.steps.filter(s => hardware.has(s.from))).toEqual([]);
  });
});

describe('path semantics', () => {
  it.each(configs)('%s on %s reaches its own hardware and never the other device', (mode, device) => {
    const p = activePath(data, mode, device);
    expect(p.stages.has(device === 'gpu' ? 'nvidia_gpu' : 'cpu')).toBe(true);
    for (const id of device === 'gpu' ? CPU_ONLY : GPU_ONLY) expect(p.stages.has(id), id).toBe(false);
  });

  it.each(DEVICES)('eager mode on %s involves no compiler stage', (device) => {
    const p = activePath(data, 'eager', device);
    for (const id of COMPILER_STAGES) expect(p.stages.has(id), id).toBe(false);
  });

  it('torch.compile on GPU follows Dynamo, FX, Inductor, Triton, LLVM IR, PTX, machine code, GPU in order', () => {
    const p = activePath(data, 'compile', 'gpu');
    const chain = ['cpython', 'dynamo', 'fx_graph', 'inductor', 'triton_kernels', 'triton_compiler', 'llvm_ir', 'ptx', 'gpu_machine_code', 'nvidia_gpu'];
    for (let i = 0; i < chain.length - 1; i++) {
      expect(p.steps.has(`${chain[i]}--${chain[i + 1]}`), `${chain[i]} -> ${chain[i + 1]}`).toBe(true);
    }
  });

  it('torch.compile on CPU generates C++/OpenMP, with ATen as a fallback only', () => {
    const p = activePath(data, 'compile', 'cpu');
    expect(p.steps.has('inductor--cpp_openmp')).toBe(true);
    expect(p.steps.has('cpp_openmp--cpu')).toBe(true);
    expect(p.steps.has('cpython--aten')).toBe(false);
    const fallback = data.steps.find(s => stepId(s) === 'inductor--aten_cpu');
    expect(fallback?.kind).toBe('falls_back_to');
  });
});

describe('generated page', () => {
  const html = readFileSync(join(ROOT, 'public/ai/how-pytorch-runs/index.html'), 'utf8');

  it('server-renders every stage, every step, and the default path', () => {
    for (const s of data.stages) {
      expect(html).toContain(`id="stage-${s.id}"`);
      expect(html).toContain(`id="detail-stage-${s.id}"`);
    }
    const p = activePath(data, 'compile', 'gpu');
    for (const s of data.steps) {
      const on = p.steps.has(stepId(s));
      expect(html).toContain(`id="detail-step-${stepId(s)}"`);
      expect(html.includes(`id="step-${stepId(s)}" class="ai-step on"`), stepId(s)).toBe(on);
    }
    expect((html.match(/<ol class="ai-path-list">([\s\S]*?)<\/ol>/)?.[1].match(/<li>/g) ?? []).length).toBe(p.steps.size);
  });

  it('shows every quote with a link to its source', () => {
    for (const ev of [...data.stages, ...data.steps].flatMap(x => x.evidence)) {
      expect(html).toContain(data.sources[ev.source].url.replace(/&/g, '&amp;'));
    }
    for (const s of data.stages) for (const ev of s.evidence) {
      expect(html).toContain(ev.quote.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
    }
  });

  it('is canonical, in the sitemap, has its social card and loads the explorer script', () => {
    expect(html).toContain('<link rel="canonical" href="https://www.languagelineage.org/ai/how-pytorch-runs" />');
    expect(readFileSync(join(ROOT, 'public/sitemap.xml'), 'utf8')).toContain('/ai/how-pytorch-runs</loc>');
    expect(html).toContain('/og/ai-how-pytorch-runs.png');
    expect(existsSync(join(ROOT, 'public/og/ai-how-pytorch-runs.png'))).toBe(true);
    expect(html).toContain('<script defer src="/ai-path.js"></script>');
    expect(existsSync(join(ROOT, 'public/ai-path.js'))).toBe(true);
  });
});
