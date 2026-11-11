/**
 * The PyTorch execution-path explainer: schema, path selection and diagram.
 * Pure functions, no side effects. Data lives in dataset/ai/pytorch_execution_paths.json.
 *
 * This is deliberately NOT part of the lineage dataset (dataset/v5/lineage_v5.json):
 * "lowers to" and "dispatches to" are execution steps, not implementation provenance,
 * and the lineage schema keeps its six relationship types (docs/DECISIONS.md). Stages
 * link to lineage nodes through `lineage_id` instead. See docs/AI_EXPANSION_PLAN.md.
 *
 * Every stage and step carries evidence: a source id plus an exact quote from that
 * source. `npm run check:ai-quotes` re-fetches the sources and checks the quotes.
 */
import { z } from 'zod';

export const MODES = ['eager', 'compile'] as const;
export const DEVICES = ['cpu', 'gpu'] as const;
export type Mode = (typeof MODES)[number];
export type Device = (typeof DEVICES)[number];

export const STAGE_KINDS = [
  'programming_language', 'runtime', 'framework_component', 'compiler',
  'intermediate_representation', 'kernel_language', 'kernel', 'machine_code', 'hardware',
] as const;
export const LAYERS = ['python', 'framework', 'compiler', 'kernel', 'hardware'] as const;

const Evidence = z.object({ source: z.string().min(1), quote: z.string().min(20) }).strict();

const Stage = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().min(1),
  kind: z.enum(STAGE_KINDS),
  layer: z.enum(LAYERS),
  lineage_id: z.string().regex(/^(lang|tool):[a-z0-9_]+$/).nullable(),
  summary: z.string().min(20),
  evidence: z.array(Evidence).min(1),
}).strict();

const Step = z.object({
  from: z.string(),
  to: z.string(),
  kind: z.enum(['runs_in', 'calls', 'dispatches_to', 'executes_on', 'launches_on', 'intercepted_by',
    'captures', 'compiled_by', 'generates', 'falls_back_to', 'lowers_to', 'translated_to']),
  mode: z.enum(['any', ...MODES]),
  device: z.enum(['any', ...DEVICES]),
  label: z.string().min(1),
  explanation: z.string().min(20),
  evidence: z.array(Evidence).min(1),
}).strict();

export const PathsFile = z.object({
  version: z.string(),
  title: z.string(),
  verified_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  verified_against: z.string(),
  scope: z.string(),
  sources: z.record(z.object({ url: z.string().url().startsWith('https://'), title: z.string() }).strict()),
  stages: z.array(Stage).min(2),
  steps: z.array(Step).min(1),
}).strict();

export type PathsData = z.infer<typeof PathsFile>;
export type StageT = PathsData['stages'][number];
export type StepT = PathsData['steps'][number];

/** Parse and cross-check the file. Throws with every problem listed. */
export function parsePaths(raw: unknown): PathsData {
  const data = PathsFile.parse(raw);
  const problems: string[] = [];
  const ids = new Set(data.stages.map(s => s.id));
  if (ids.size !== data.stages.length) problems.push('duplicate stage id');
  const all = [...data.stages.map(s => ({ where: `stage ${s.id}`, ev: s.evidence })), ...data.steps.map(s => ({ where: `step ${s.from}->${s.to}`, ev: s.evidence }))];
  for (const { where, ev } of all) for (const e of ev) if (!data.sources[e.source]) problems.push(`${where}: unknown source ${e.source}`);
  for (const s of data.steps) {
    if (!ids.has(s.from)) problems.push(`step from unknown stage ${s.from}`);
    if (!ids.has(s.to)) problems.push(`step to unknown stage ${s.to}`);
  }
  if (problems.length) throw new Error(problems.join('\n'));
  return data;
}

export const stepId = (s: StepT) => `${s.from}--${s.to}`;

export function stepApplies(s: StepT, mode: Mode, device: Device): boolean {
  return (s.mode === 'any' || s.mode === mode) && (s.device === 'any' || s.device === device);
}

/** The stages and steps reachable from the first stage under one configuration. */
export function activePath(data: PathsData, mode: Mode, device: Device): { stages: Set<string>; steps: Set<string> } {
  const steps = data.steps.filter(s => stepApplies(s, mode, device));
  const start = data.stages[0].id;
  const reached = new Set([start]);
  const used = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const s of steps) {
      if (reached.has(s.from) && !used.has(stepId(s))) {
        used.add(stepId(s));
        if (!reached.has(s.to)) reached.add(s.to);
        grew = true;
      }
    }
  }
  return { stages: reached, steps: used };
}

// Diagram layout: column (0..3, may be fractional) and row for each stage.
export const LAYOUT: Record<string, [number, number]> = {
  python_code: [1.5, 0], cpython: [1.5, 1],
  aten: [0.5, 2], dynamo: [2.5, 2],
  aten_cpu: [0, 3], aten_cuda: [1, 3], fx_graph: [2.5, 3],
  inductor: [2.5, 4],
  cpp_openmp: [2, 5], triton_kernels: [3, 5],
  triton_compiler: [3, 6], llvm_ir: [3, 7], ptx: [3, 8], gpu_machine_code: [3, 9],
  cpu: [0.75, 10], nvidia_gpu: [2.5, 10],
};

export const KIND_STYLE: Record<string, { label: string; color: string }> = {
  programming_language: { label: 'Python', color: '#60a5fa' },
  runtime: { label: 'Python', color: '#60a5fa' },
  framework_component: { label: 'PyTorch core (C++)', color: '#e3a008' },
  kernel: { label: 'Kernel', color: '#f472b6' },
  kernel_language: { label: 'Kernel', color: '#f472b6' },
  compiler: { label: 'Compiler', color: '#a78bfa' },
  intermediate_representation: { label: 'Intermediate representation', color: '#22d3ee' },
  machine_code: { label: 'Hardware', color: '#4ade80' },
  hardware: { label: 'Hardware', color: '#4ade80' },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const BOX_W = 176, BOX_H = 46, COL_W = 206, ROW_H = 78, PAD = 16;

export function buildPathSvg(data: PathsData, mode: Mode, device: Device): string {
  const active = activePath(data, mode, device);
  const pos = (id: string) => {
    const [c, r] = LAYOUT[id];
    return { x: PAD + c * COL_W, y: PAD + r * ROW_H };
  };
  const W = PAD * 2 + 3 * COL_W + BOX_W;
  const H = PAD * 2 + 10 * ROW_H + BOX_H;

  const edges = data.steps.map(s => {
    const a = pos(s.from), b = pos(s.to);
    let d: string;
    if (LAYOUT[s.to][1] > LAYOUT[s.from][1]) {
      const x1 = a.x + BOX_W / 2, y1 = a.y + BOX_H, x2 = b.x + BOX_W / 2, y2 = b.y;
      const my = (y1 + y2) / 2;
      d = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2 - 6}`;
    } else {
      // Same row or upward (an Inductor fallback into ATen): connect the facing sides.
      const leftward = b.x < a.x;
      const x1 = leftward ? a.x : a.x + BOX_W, y1 = a.y + BOX_H / 2;
      const x2 = leftward ? b.x + BOX_W + 6 : b.x - 6, y2 = b.y + BOX_H / 2;
      const mx = (x1 + x2) / 2;
      d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    }
    const on = active.steps.has(stepId(s));
    const dashed = s.kind === 'falls_back_to' ? ' stroke-dasharray="5 4"' : '';
    return `<path id="step-${stepId(s)}" class="ai-step${on ? ' on' : ''}" data-mode="${s.mode}" data-device="${s.device}" d="${d}"${dashed} marker-end="url(#ai-arrow)" tabindex="0" role="button" aria-label="${esc(`${nameOf(data, s.from)} ${s.label} ${nameOf(data, s.to)}`)}"><title>${esc(`${nameOf(data, s.from)} ${s.label} ${nameOf(data, s.to)}`)}</title></path>`;
  }).join('\n');

  const nodes = data.stages.map(st => {
    const { x, y } = pos(st.id);
    const style = KIND_STYLE[st.kind];
    const on = active.stages.has(st.id);
    return `<g id="stage-${st.id}" class="ai-stage${on ? ' on' : ''}" tabindex="0" role="button" aria-label="${esc(`${st.name}: ${style.label}`)}">
  <rect x="${x}" y="${y}" width="${BOX_W}" height="${BOX_H}" rx="7" style="--kc:${style.color}"/>
  <rect x="${x}" y="${y}" width="4" height="${BOX_H}" rx="2" fill="${style.color}"/>
  <text x="${x + 14}" y="${y + 19}" class="ai-name">${esc(st.name)}</text>
  <text x="${x + 14}" y="${y + 35}" class="ai-kind">${esc(st.kind.replace(/_/g, ' '))}</text>
</g>`;
  }).join('\n');

  return `<svg class="ai-path-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Execution path diagram: select a stage or step for details">
<defs><marker id="ai-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#9a9a9a"/></marker></defs>
${edges}
${nodes}
</svg>`;
}

function nameOf(data: PathsData, id: string): string {
  return data.stages.find(s => s.id === id)?.name ?? id;
}
