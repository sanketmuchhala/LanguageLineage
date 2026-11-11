/**
 * AI execution-path explainers (/ai/<slug>): schema, path selection and diagram.
 * Pure functions, no side effects. Each page is one file in dataset/ai/*.json.
 *
 * This is deliberately NOT part of the lineage dataset (dataset/v5/lineage_v5.json):
 * "lowers to" and "dispatches to" are execution steps, not implementation provenance,
 * and the lineage schema keeps its six relationship types (docs/DECISIONS.md). Stages
 * link to lineage nodes through `lineage_id` instead. See docs/AI_EXPANSION_PLAN.md.
 *
 * A file declares its own choices ("dimensions", e.g. mode and device, or backend).
 * A step applies to a selection when, for every dimension it lists in `when`, the
 * selected value is one of the listed values; dimensions it omits apply to all values.
 *
 * Every stage and step carries evidence: a source id plus an exact quote from that
 * source. `npm run check:ai-quotes` re-fetches the sources and checks the quotes.
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

export const STAGE_KINDS = [
  'application', 'programming_language', 'runtime', 'framework_component', 'compiler',
  'intermediate_representation', 'model_format', 'kernel_language', 'kernel', 'machine_code', 'hardware',
] as const;
export const LAYERS = ['python', 'application', 'framework', 'compiler', 'kernel', 'hardware'] as const;
export const STEP_KINDS = [
  'runs_in', 'calls', 'loads', 'builds', 'dispatches_to', 'executes_on', 'launches_on', 'intercepted_by',
  'captures', 'compiled_by', 'compiles_for', 'generates', 'written_in', 'falls_back_to', 'lowers_to', 'translated_to',
] as const;

const Evidence = z.object({ source: z.string().min(1), quote: z.string().min(20) }).strict();
const Id = z.string().regex(/^[a-z][a-z0-9_]*$/);

const Dimension = z.object({
  id: Id,
  legend: z.string().min(1),
  default: z.string(),
  options: z.array(z.object({ value: Id, label: z.string().min(1), phrase: z.string().min(1) }).strict()).min(2),
}).strict();

const Stage = z.object({
  id: Id,
  name: z.string().min(1).max(21),
  kind: z.enum(STAGE_KINDS),
  layer: z.enum(LAYERS),
  lineage_id: z.string().regex(/^(lang|tool):[a-z0-9_]+$/).nullable(),
  pos: z.tuple([z.number().min(0).max(3), z.number().int().min(0).max(14)]),
  summary: z.string().min(20),
  evidence: z.array(Evidence).min(1),
}).strict();

const Step = z.object({
  from: Id,
  to: Id,
  kind: z.enum(STEP_KINDS),
  when: z.record(z.array(z.string()).min(1)),
  label: z.string().min(1),
  explanation: z.string().min(20),
  evidence: z.array(Evidence).min(1),
}).strict();

export const PathsFile = z.object({
  version: z.string(),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().max(75),
  h1: z.string().min(10),
  description: z.string().min(75).max(180),
  og_subtitle: z.string().min(10),
  verified_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  verified_against: z.string(),
  scope: z.string(),
  answer: z.string().min(50),
  status_template: z.string().includes('{'),
  dimensions: z.array(Dimension).min(1).max(3),
  sections: z.array(z.object({ heading: z.string().min(3), paragraphs: z.array(z.string().min(20)).min(1) }).strict()),
  out_of_scope_note: z.string(),
  link_from: z.array(z.string().regex(/^(lang|tool):[a-z0-9_]+$/)),
  sources: z.record(z.object({ url: z.string().url().startsWith('https://'), title: z.string() }).strict()),
  stages: z.array(Stage).min(2),
  steps: z.array(Step).min(1),
}).strict();

export type PathsData = z.infer<typeof PathsFile>;
export type StageT = PathsData['stages'][number];
export type StepT = PathsData['steps'][number];
export type Selection = Record<string, string>;

/** Parse and cross-check one file. Throws with every problem listed. */
export function parsePaths(raw: unknown): PathsData {
  const data = PathsFile.parse(raw);
  const problems: string[] = [];
  const ids = new Set(data.stages.map(s => s.id));
  if (ids.size !== data.stages.length) problems.push('duplicate stage id');
  const dims = new Map(data.dimensions.map(d => [d.id, new Set(d.options.map(o => o.value))]));
  for (const d of data.dimensions) {
    if (!dims.get(d.id)!.has(d.default)) problems.push(`dimension ${d.id}: default ${d.default} is not an option`);
    if (!data.status_template.includes(`{${d.id}}`)) problems.push(`status_template does not mention {${d.id}}`);
  }
  const positions = new Set<string>();
  for (const s of data.stages) {
    const key = s.pos.join(',');
    if (positions.has(key)) problems.push(`stage ${s.id}: position ${key} already used`);
    positions.add(key);
  }
  const all = [...data.stages.map(s => ({ where: `stage ${s.id}`, ev: s.evidence })), ...data.steps.map(s => ({ where: `step ${s.from}->${s.to}`, ev: s.evidence }))];
  for (const { where, ev } of all) for (const e of ev) if (!data.sources[e.source]) problems.push(`${where}: unknown source ${e.source}`);
  for (const s of data.steps) {
    if (!ids.has(s.from)) problems.push(`step from unknown stage ${s.from}`);
    if (!ids.has(s.to)) problems.push(`step to unknown stage ${s.to}`);
    for (const [dim, values] of Object.entries(s.when)) {
      const opts = dims.get(dim);
      if (!opts) problems.push(`step ${s.from}->${s.to}: unknown dimension ${dim}`);
      else for (const v of values) if (!opts.has(v)) problems.push(`step ${s.from}->${s.to}: ${dim}=${v} is not an option`);
    }
  }
  if (problems.length) throw new Error(`${data.slug}:\n${problems.join('\n')}`);
  return data;
}

/** Every file in dataset/ai, parsed and sorted by slug. */
export function loadAllPaths(root: string): PathsData[] {
  const dir = join(root, 'dataset/ai');
  return readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => {
    const data = parsePaths(JSON.parse(readFileSync(join(dir, f), 'utf8')));
    if (f !== `${data.slug}.json`) throw new Error(`dataset/ai/${f}: file name must be ${data.slug}.json`);
    return data;
  });
}

export const stepId = (s: StepT) => `${s.from}--${s.to}`;

export function defaultSelection(data: PathsData): Selection {
  return Object.fromEntries(data.dimensions.map(d => [d.id, d.default]));
}

/** Every combination of dimension values. */
export function allSelections(data: PathsData): Selection[] {
  return data.dimensions.reduce<Selection[]>((acc, d) => acc.flatMap(sel => d.options.map(o => ({ ...sel, [d.id]: o.value }))), [{}]);
}

export function stepApplies(s: StepT, sel: Selection): boolean {
  return Object.entries(s.when).every(([dim, values]) => values.includes(sel[dim]));
}

/** The stages and steps reachable from the first stage under one selection. */
export function activePath(data: PathsData, sel: Selection): { stages: Set<string>; steps: Set<string> } {
  const steps = data.steps.filter(s => stepApplies(s, sel));
  const reached = new Set([data.stages[0].id]);
  const used = new Set<string>();
  let grew = true;
  while (grew) {
    grew = false;
    for (const s of steps) {
      if (reached.has(s.from) && !used.has(stepId(s))) {
        used.add(stepId(s));
        reached.add(s.to);
        grew = true;
      }
    }
  }
  return { stages: reached, steps: used };
}

export function statusText(data: PathsData, sel: Selection, nStages: number, nSteps: number): string {
  let text = data.status_template;
  for (const d of data.dimensions) text = text.replace(`{${d.id}}`, d.options.find(o => o.value === sel[d.id])!.phrase);
  return `${text}: ${nStages} stages, ${nSteps} steps.`;
}

/** Human-readable conditions of a step, e.g. "torch.compile · NVIDIA GPU". */
export function whenText(data: PathsData, s: StepT): string {
  return data.dimensions.map(d => {
    const values = s.when[d.id];
    const opts = values ? d.options.filter(o => values.includes(o.value)) : d.options;
    return opts.length === d.options.length ? `any ${d.legend.toLowerCase()}` : opts.map(o => o.label).join(' or ');
  }).join(' · ');
}

export const KIND_STYLE: Record<string, { label: string; color: string }> = {
  application: { label: 'Your program', color: '#60a5fa' },
  programming_language: { label: 'Your program', color: '#60a5fa' },
  runtime: { label: 'Your program', color: '#60a5fa' },
  framework_component: { label: 'Framework core', color: '#e3a008' },
  model_format: { label: 'Model file', color: '#fb7185' },
  kernel: { label: 'Kernel', color: '#f472b6' },
  kernel_language: { label: 'Kernel', color: '#f472b6' },
  compiler: { label: 'Compiler', color: '#a78bfa' },
  intermediate_representation: { label: 'Intermediate representation', color: '#22d3ee' },
  machine_code: { label: 'Hardware', color: '#4ade80' },
  hardware: { label: 'Hardware', color: '#4ade80' },
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const BOX_W = 176, BOX_H = 46, COL_W = 206, ROW_H = 78, PAD = 16;

export function buildPathSvg(data: PathsData, sel: Selection): string {
  const active = activePath(data, sel);
  const byId = new Map(data.stages.map(s => [s.id, s]));
  const pos = (id: string) => {
    const [c, r] = byId.get(id)!.pos;
    return { x: PAD + c * COL_W, y: PAD + r * ROW_H, row: r };
  };
  const maxCol = Math.max(...data.stages.map(s => s.pos[0]));
  const maxRow = Math.max(...data.stages.map(s => s.pos[1]));
  const W = PAD * 2 + maxCol * COL_W + BOX_W;
  const H = PAD * 2 + maxRow * ROW_H + BOX_H;
  const name = (id: string) => byId.get(id)!.name;

  const edges = data.steps.map(s => {
    const a = pos(s.from), b = pos(s.to);
    let d: string;
    if (b.row > a.row) {
      const x1 = a.x + BOX_W / 2, y1 = a.y + BOX_H, x2 = b.x + BOX_W / 2, y2 = b.y;
      const my = (y1 + y2) / 2;
      d = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2 - 6}`;
    } else {
      // Same row or upward: connect the facing sides.
      const leftward = b.x < a.x;
      const x1 = leftward ? a.x : a.x + BOX_W, y1 = a.y + BOX_H / 2;
      const x2 = leftward ? b.x + BOX_W + 6 : b.x - 6, y2 = b.y + BOX_H / 2;
      const mx = (x1 + x2) / 2;
      d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    }
    const on = active.steps.has(stepId(s));
    const dashed = s.kind === 'falls_back_to' ? ' stroke-dasharray="5 4"' : '';
    const label = `${name(s.from)} ${s.label} ${name(s.to)}`;
    return `<path id="step-${stepId(s)}" class="ai-step${on ? ' on' : ''}" d="${d}"${dashed} marker-end="url(#ai-arrow)" tabindex="0" role="button" aria-label="${esc(label)}"><title>${esc(label)}</title></path>`;
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
