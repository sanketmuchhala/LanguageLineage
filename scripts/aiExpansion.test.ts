import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { activePath, allSelections, loadAllPaths, type Selection } from './aiPaths';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = loadAllPaths(root);
function trace(slug: string, selection: Selection) {
  const data = pages.find(page => page.slug === slug)!;
  return activePath(data, selection);
}

describe('expanded execution paths preserve architectural boundaries', () => {
  it.each(['cpu', 'gpu'])('TensorFlow graph execution on %s does not imply XLA', device => {
    const eager = trace('how-tensorflow-runs', { mode: 'eager', device }).stages;
    const graph = trace('how-tensorflow-runs', { mode: 'graph', device }).stages;
    const compiled = trace('how-tensorflow-runs', { mode: 'xla', device }).stages;
    expect(eager.has('graph')).toBe(false);
    expect(eager.has('xla')).toBe(false);
    expect(graph.has('graph')).toBe(true);
    expect(graph.has('xla')).toBe(false);
    expect(compiled.has('xla')).toBe(true);
    expect(compiled.has(device + '_code')).toBe(true);
    expect(compiled.has('eager')).toBe(false);
  });

  it('ONNX provider selection preserves CPU fallback and the separate TensorRT path', () => {
    const cpu = trace('how-onnx-runtime-runs', { provider: 'cpu' }).stages;
    const cuda = trace('how-onnx-runtime-runs', { provider: 'cuda' }).stages;
    const tensorrt = trace('how-onnx-runtime-runs', { provider: 'tensorrt' }).stages;
    expect(cpu.has('cpu_hw')).toBe(true);
    expect(cpu.has('nvidia_gpu')).toBe(false);
    expect(cuda.has('cpu_ep')).toBe(true);
    expect(cuda.has('nvidia_gpu')).toBe(true);
    expect(cuda.has('trt_ep')).toBe(false);
    expect(tensorrt.has('trt_ep')).toBe(true);
    expect(tensorrt.has('cpu_ep')).toBe(true);
  });

  it.each(['tensorflow', 'jax', 'torch'])('Keras %s selects one framework backend', backend => {
    for (const device of ['cpu', 'gpu']) {
      const stages = trace('how-keras-runs', { backend, device }).stages;
      expect(['tensorflow', 'jax', 'torch'].filter(id => stages.has(id))).toEqual([backend]);
      expect(['cpu', 'gpu'].filter(id => stages.has(id))).toEqual([device]);
    }
  });

  it('Ollama MLX and GGUF routes are not presented as the same engine', () => {
    const cpu = trace('how-ollama-runs', { route: 'gguf_cpu' }).stages;
    const cuda = trace('how-ollama-runs', { route: 'gguf_cuda' }).stages;
    const mlx = trace('how-ollama-runs', { route: 'mlx_metal' }).stages;
    expect(cpu.has('llama')).toBe(true);
    expect(cpu.has('gpu')).toBe(false);
    expect(cuda.has('cuda_kernel')).toBe(true);
    expect(cuda.has('mlx')).toBe(false);
    expect(mlx.has('mlx')).toBe(true);
    expect(mlx.has('llama')).toBe(false);
    expect(mlx.has('apple_gpu')).toBe(true);
  });

  it.each(['python', 'http'])('current TensorRT-LLM %s entry reaches its scheduled PyTorch engine', interfaceName => {
    const stages = trace('how-tensorrt-llm-runs', { interface: interfaceName }).stages;
    for (const stage of ['executor', 'scheduler', 'engine', 'kernels', 'gpu']) expect(stages.has(stage), stage).toBe(true);
    expect(stages.has(interfaceName === 'python' ? 'http' : 'python_api')).toBe(false);
  });

  it('every new stage is reachable in at least one documented selection', () => {
    for (const page of pages.filter(page => ['how-tensorflow-runs', 'how-onnx-runtime-runs', 'how-keras-runs', 'how-ollama-runs', 'how-tensorrt-llm-runs'].includes(page.slug))) {
      const reachable = new Set(allSelections(page).flatMap(selection => [...activePath(page, selection).stages]));
      expect(page.stages.filter(stage => !reachable.has(stage.id)).map(stage => stage.id), page.slug).toEqual([]);
    }
  });
});


describe('new page selectors match their server-rendered execution data', () => {
  const client = readFileSync(join(root, 'public/ai-path.js'), 'utf8');
  const newPages = pages.filter(page => ['how-tensorflow-runs', 'how-onnx-runtime-runs', 'how-keras-runs', 'how-ollama-runs', 'how-tensorrt-llm-runs'].includes(page.slug));
  it.each(newPages.map(page => [page.slug, page] as const))('%s supports all selections and shareable URLs', (_slug, page) => {
    const markup = readFileSync(join(root, 'public/ai', page.slug, 'index.html'), 'utf8');
    const dom = new JSDOM(markup, { url: `https://www.languagelineage.org/ai/${page.slug}`, runScripts: 'outside-only' });
    try {
      dom.window.eval(client);
      for (const selection of allSelections(page)) {
        for (const [name, value] of Object.entries(selection)) {
          const input = dom.window.document.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement;
          input.checked = true;
          input.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
        }
        const expected = activePath(page, selection);
        const shown = [...dom.window.document.querySelectorAll('.ai-stage.on')].map(stage => stage.id.replace(/^stage-/, '')).sort();
        expect(shown).toEqual([...expected.stages].sort());
        expect(dom.window.document.querySelectorAll('.ai-path-list li').length).toBe(expected.steps.size);
        const params = new URL(dom.window.location.href).searchParams;
        for (const [key, value] of Object.entries(selection)) expect(params.get(key)).toBe(value);
      }
      const first = dom.window.document.querySelector('.ai-stage.on')!;
      first.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(dom.window.document.querySelector('.ai-detail h3')).not.toBeNull();
      expect(new URL(dom.window.location.href).searchParams.get('stage')).toBe(first.id.slice(6));
    } finally {
      dom.window.close();
    }
  });
});
