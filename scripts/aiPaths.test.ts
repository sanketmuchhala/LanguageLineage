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

describe('how-pytorch-runs on AMD (ROCm) and Apple (MPS) GPUs', () => {
  const data = bySlug('how-pytorch-runs');
  const path = (mode: string, device: string) => activePath(data, { mode, device });
  const NVIDIA_ONLY = ['aten_cuda', 'ptx', 'gpu_machine_code', 'nvidia_gpu'];

  it.each(['eager', 'compile'])('%s on ROCm reaches the AMD GPU and nothing NVIDIA-specific', (mode) => {
    const p = path(mode, 'rocm');
    expect(p.stages.has('amd_gpu')).toBe(true);
    for (const id of [...NVIDIA_ONLY, 'apple_gpu', 'cpu', 'aten_mps', 'metal_shaders']) expect(p.stages.has(id), id).toBe(false);
  });

  it('torch.compile on ROCm takes the Triton route to AMDGCN, with ATen fallbacks on HIP', () => {
    const p = path('compile', 'rocm');
    const chain = ['inductor', 'triton_kernels', 'triton_compiler', 'llvm_ir', 'amdgcn', 'amd_gpu'];
    for (let i = 0; i < chain.length - 1; i++) expect(p.steps.has(`${chain[i]}--${chain[i + 1]}`), `${chain[i]} -> ${chain[i + 1]}`).toBe(true);
    expect(data.steps.find(s => stepId(s) === 'inductor--aten_hip')?.kind).toBe('falls_back_to');
  });

  it.each(['eager', 'compile'])('%s on MPS stays on the Apple GPU, without Triton or CUDA', (mode) => {
    const p = path(mode, 'mps');
    expect(p.stages.has('apple_gpu')).toBe(true);
    for (const id of [...NVIDIA_ONLY, 'amd_gpu', 'cpu', 'triton_kernels', 'amdgcn', 'aten_hip']) expect(p.stages.has(id), id).toBe(false);
  });

  it('torch.compile on MPS is the documented prototype: Metal shaders for elementwise ops, the rest on MPS kernels', () => {
    const p = path('compile', 'mps');
    expect(p.steps.has('inductor--metal_shaders')).toBe(true);
    expect(data.steps.find(s => stepId(s) === 'inductor--aten_mps')?.kind).toBe('falls_back_to');
    expect(data.stages.find(s => s.id === 'metal_shaders')!.summary).toMatch(/prototype/);
  });
});

describe('how-sglang-runs semantics', () => {
  const data = bySlug('how-sglang-runs');
  const path = (gpu: string) => activePath(data, { gpu });
  const BACKEND: Record<string, string> = { ampere: 'flashinfer', hopper: 'fa3', blackwell: 'trtllm_mha' };

  it.each(Object.keys(BACKEND))('%s goes through the serving processes, the radix cache and only its default attention backend', (gpu) => {
    const p = path(gpu);
    for (const id of ['http_server', 'tokenizer_manager', 'scheduler', 'radix_cache', 'model_runner', 'cuda_graph', 'detokenizer', 'gpu']) expect(p.stages.has(id), id).toBe(true);
    for (const [other, backend] of Object.entries(BACKEND)) expect(p.stages.has(backend), `${gpu} uses ${backend}`).toBe(other === gpu);
  });

  it('requests reach the scheduler over ZMQ and output returns through the detokenizer', () => {
    const p = path('hopper');
    for (const s of ['tokenizer_manager--scheduler', 'scheduler--detokenizer', 'detokenizer--tokenizer_manager']) expect(p.steps.has(s), s).toBe(true);
  });
});

describe('how-vllm-runs semantics', () => {
  const data = bySlug('how-vllm-runs');
  const path = (mode: string, attention: string) => activePath(data, { mode, attention });
  const COMPILER = ['dynamo', 'graph_pieces', 'inductor', 'triton_kernels', 'cuda_graphs'];
  const SERVING = ['client', 'api_server', 'engine_core', 'gpu_worker', 'model_runner', 'model', 'attention_op'];

  it.each([['compiled', 'flash'], ['compiled', 'triton'], ['eager', 'flash'], ['eager', 'triton']])('%s with %s attention goes through the whole serving stack', (mode, attention) => {
    const p = path(mode, attention);
    for (const id of SERVING) expect(p.stages.has(id), id).toBe(true);
  });

  it.each(['flash', 'triton'])('--enforce-eager with %s attention involves no compiler stage and no CUDA Graphs', (attention) => {
    const p = path('eager', attention);
    for (const id of COMPILER) expect(p.stages.has(id), id).toBe(false);
    expect(p.stages.has('eager_kernels')).toBe(true);
  });

  it('the compiled mode follows Dynamo, piecewise graph, Inductor, Triton, CUDA Graphs, GPU in order, and skips the eager kernels', () => {
    const p = path('compiled', 'flash');
    const chain = ['model', 'dynamo', 'graph_pieces', 'inductor', 'triton_kernels', 'cuda_graphs', 'gpu'];
    for (let i = 0; i < chain.length - 1; i++) expect(p.steps.has(`${chain[i]}--${chain[i + 1]}`), `${chain[i]} -> ${chain[i + 1]}`).toBe(true);
    expect(p.stages.has('eager_kernels')).toBe(false);
  });

  it('each attention choice uses only its own backend', () => {
    expect(path('compiled', 'flash').stages.has('triton_attn')).toBe(false);
    expect(path('compiled', 'triton').stages.has('flash_attn')).toBe(false);
    expect(path('eager', 'triton').stages.has('triton_attn')).toBe(true);
  });
});

describe('how-mlx-runs semantics', () => {
  const data = bySlug('how-mlx-runs');
  const path = (mode: string, device: string) => activePath(data, { mode, device });
  const GPU_ONLY = ['metal_kernels', 'fused_metal', 'gpu'];
  const CPU_ONLY = ['cpu_kernels', 'fused_cpu', 'cpu'];

  it.each([['lazy', 'gpu'], ['lazy', 'cpu'], ['compiled', 'gpu'], ['compiled', 'cpu']])('%s on %s records a lazy graph, evaluates it, and stays on its own device', (mode, device) => {
    const p = path(mode, device);
    for (const id of ['python_code', 'mlx', 'graph', 'eval']) expect(p.stages.has(id), id).toBe(true);
    for (const id of device === 'gpu' ? CPU_ONLY : GPU_ONLY) expect(p.stages.has(id), id).toBe(false);
  });

  it.each(['gpu', 'cpu'])('without mx.compile on %s there is no compiler or fused code', (device) => {
    const p = path('lazy', device);
    for (const id of ['compile', 'fused_metal', 'fused_cpu']) expect(p.stages.has(id), id).toBe(false);
  });

  it('mx.compile generates a fused Metal kernel on the GPU and a C++ library on the CPU', () => {
    expect(path('compiled', 'gpu').steps.has('compile--fused_metal')).toBe(true);
    expect(path('compiled', 'cpu').steps.has('compile--fused_cpu')).toBe(true);
    expect(path('compiled', 'gpu').steps.has('graph--compile')).toBe(true);
  });
});

describe('how-onnx-runtime-runs semantics', () => {
  const data = bySlug('how-onnx-runtime-runs');
  const path = (provider: string) => activePath(data, { provider });

  it('CPU provider stays on CPU without touching CUDA or TensorRT', () => {
    const p = path('cpu');
    expect(p.stages.has('cpu_hw')).toBe(true);
    expect(p.stages.has('nvidia_gpu')).toBe(false);
    expect(p.stages.has('cuda_ep')).toBe(false);
    expect(p.stages.has('trt_ep')).toBe(false);
  });

  it('CUDA and TensorRT providers partition through GetCapability with fallback to lower-priority providers', () => {
    const cuda = path('cuda');
    expect(cuda.stages.has('cuda_ep')).toBe(true);
    expect(cuda.stages.has('trt_ep')).toBe(false);
    expect(cuda.steps.has('partitioner--cpu_ep')).toBe(true);

    const trt = path('tensorrt');
    expect(trt.stages.has('trt_ep')).toBe(true);
    expect(trt.steps.has('trt_ep--cuda_ep')).toBe(true);
    expect(trt.steps.has('partitioner--cpu_ep')).toBe(true);
  });
});

describe('how-tensorrt-llm-runs semantics', () => {
  const data = bySlug('how-tensorrt-llm-runs');
  const path = (mode: string, attention: string) => activePath(data, { mode, attention });
  const COMPILER = ['dynamo_fx', 'aten_passes', 'piecewise_graphs'];
  const CONTROL = ['entry', 'py_executor', 'scheduler', 'kv_cache', 'model_engine', 'pytorch_model', 'attention_op', 'sampler', 'gpu'];

  it.each([['compiled', 'trtllm'], ['compiled', 'flashinfer'], ['eager', 'trtllm'], ['eager', 'flashinfer']])('%s with %s attention goes through the PyExecutor, C++ scheduler, KV cache, and PyTorch model engine', (mode, attention) => {
    const p = path(mode, attention);
    for (const id of CONTROL) expect(p.stages.has(id), id).toBe(true);
  });

  it.each(['trtllm', 'flashinfer'])('eager mode with %s attention skips torch.compile and uses eager prefill + decode CUDA graphs', (attention) => {
    const p = path('eager', attention);
    for (const id of COMPILER) expect(p.stages.has(id), id).toBe(false);
    expect(p.stages.has('eager_prefill')).toBe(true);
    expect(p.stages.has('decode_graphs')).toBe(true);
  });

  it('the compiled path lowers Dynamo FX to ATen IR passes and Piecewise CUDA Graphs without TorchInductor, skipping eager prefill', () => {
    const p = path('compiled', 'trtllm');
    const chain = ['pytorch_model', 'dynamo_fx', 'aten_passes', 'piecewise_graphs', 'sampler', 'gpu'];
    for (let i = 0; i < chain.length - 1; i++) expect(p.steps.has(`${chain[i]}--${chain[i + 1]}`), `${chain[i]} -> ${chain[i + 1]}`).toBe(true);
    expect(p.stages.has('eager_prefill')).toBe(false);
    expect(p.stages.has('decode_graphs')).toBe(false);
  });

  it('each attention choice uses only its own custom op backend', () => {
    expect(path('compiled', 'trtllm').stages.has('flashinfer_attn')).toBe(false);
    expect(path('compiled', 'flashinfer').stages.has('trtllm_attn')).toBe(false);
    expect(path('eager', 'flashinfer').stages.has('flashinfer_attn')).toBe(true);
  });
});

describe('explainer pages link their path to the graph explorer', () => {
  it.each(files.map(f => [f.slug, f] as const))('%s links /explore with view=ai, its slug and default choices', (_slug, data) => {
    const href = page(data).match(/<a class="ai-graph-link" href="([^"]+)"/)?.[1];
    expect(href).toBeDefined();
    const q = new URLSearchParams(href!.replace(/&amp;/g, '&').split('?')[1]);
    expect(href!.startsWith('/explore?')).toBe(true);
    expect(q.get('view')).toBe('ai');
    expect(q.get('path')).toBe(data.slug);
    for (const [dim, value] of Object.entries(defaultSelection(data))) expect(q.get(dim)).toBe(value);
  });
});

describe('explainer prose renders its links', () => {
  // Markdown links in sections and answers must become anchors, never raw "[text](url)" text.
  it.each(files.map(f => [f.slug, f] as const))('%s shows no raw markdown links', (_slug, data) => {
    const visible = page(data).replace(/<script[\s\S]*?<\/script>/g, '');
    expect(visible).not.toMatch(/\]\((?:https?:\/\/|\/)/);
  });
});

describe('/ai hub page', () => {
  const hub = readFileSync(join(ROOT, 'public/ai/index.html'), 'utf8');
  const table = (id: string) => hub.match(new RegExp(`<table id="${id}">[\\s\\S]*?</table>`))?.[0] ?? '';

  it('links every explainer, and every explainer links back', () => {
    for (const f of files) {
      expect(hub).toContain(`<h2><a href="/ai/${f.slug}">`);
      expect(page(f)).toContain('<a href="/ai">AI execution paths</a>');
    }
  });

  it('lists every selectable path with the counts from its data file', () => {
    const rows = table('ai-path-lengths').match(/<tr><td>[\s\S]*?<\/tr>/g) ?? [];
    expect(rows.length).toBe(files.reduce((n, f) => n + allSelections(f).length, 0));
    for (const f of files) {
      for (const sel of allSelections(f)) {
        const q = Object.entries(sel).map(([k, v]) => `${k}=${v}`).join('&amp;');
        const row = rows.find(r => r.includes(`href="/ai/${f.slug}?${q}"`));
        expect(row, `${f.slug} ${q}`).toBeDefined();
        const p = activePath(f, sel);
        expect(row).toContain(`<td>${p.stages.size}</td><td>${p.steps.size}</td>`);
      }
    }
  });

  it('marks a tool as shared only where a stage links to it', () => {
    const rows = table('ai-shared-tools').match(/<tr><td>[\s\S]*?<\/tr>/g) ?? [];
    const ids = new Set(files.flatMap(f => f.stages.map(s => s.lineage_id)).filter((id): id is string => !!id));
    expect(rows.length).toBe(ids.size);
    for (const row of rows) {
      const cells = row.match(/<td>[\s\S]*?<\/td>/g)!.slice(1);
      const name = row.match(/<td><a [^>]*>([^<]+)<\/a>/)![1];
      const id = [...ids].find(i => (lineage.languages as Array<{ id: string; name: string }>).find(n => n.id === i)?.name === name)!;
      expect(id, name).toBeDefined();
      files.forEach((f, i) => expect(cells[i].includes('aria-label="yes"'), `${name} in ${f.slug}`).toBe(f.stages.some(s => s.lineage_id === id)));
    }
  });

  it('is in the sitemap', () => {
    const sitemap = readFileSync(join(ROOT, 'public/sitemap.xml'), 'utf8');
    expect(sitemap).toContain('<loc>https://www.languagelineage.org/ai</loc>');
  });
});
