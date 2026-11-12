/**
 * The AI execution-path explainers (dataset/ai/*.json, published at /ai/<slug>) as the
 * graph explorer needs them: which atlas nodes each explainer's stages link to.
 *
 * Read at build time with import.meta.glob and only the fields used here, so there is
 * no extra request and no hand-kept list of "AI" nodes: a tool counts as AI
 * infrastructure exactly when an explainer has a stage linked to it.
 */
import type { RawEdge } from './types';
import { activePath, defaultSelection, stepId, type PathShape, type Selection } from './aiPathLogic';

interface StageRef { lineage_id: string | null }

const slugs = import.meta.glob<string>('../../dataset/ai/*.json', { eager: true, import: 'slug' });
const names = import.meta.glob<string>('../../dataset/ai/*.json', { eager: true, import: 'name' });
const stages = import.meta.glob<StageRef[]>('../../dataset/ai/*.json', { eager: true, import: 'stages' });

export interface AiExplainer {
  slug: string;
  name: string;
  /** Atlas node ids that the explainer's stages link to. */
  nodeIds: string[];
}

export const AI_EXPLAINERS: AiExplainer[] = Object.keys(slugs).sort().map((file) => ({
  slug: slugs[file],
  name: names[file],
  nodeIds: [...new Set(stages[file].map((s) => s.lineage_id).filter((id): id is string => !!id))],
}));

/** Tools that appear as a stage in at least one explainer (PyTorch, Triton, CUDA, ...). */
export const AI_TOOL_IDS: ReadonlySet<string> = new Set(
  AI_EXPLAINERS.flatMap((e) => e.nodeIds).filter((id) => id.startsWith('tool:')),
);

/** Explainers whose diagram includes this node, for links from the node's drawer. */
export function explainersFor(nodeId: string): AiExplainer[] {
  return AI_EXPLAINERS.filter((e) => e.nodeIds.includes(nodeId));
}

/**
 * Nodes shown by the explorer's AI infrastructure filter: every node an explainer stage
 * links to (the AI tools, plus languages such as Python or machine code that a path
 * passes through), and what the AI tools are implemented in (sources of their
 * non-influence edges), so the view answers "what is this AI stack written in?".
 * Influence edges are left out on purpose.
 */
export function aiViewNodeIds(edges: Pick<RawEdge, 'from_language' | 'to_language' | 'relationship'>[]): Set<string> {
  const ids = new Set<string>(AI_EXPLAINERS.flatMap((e) => e.nodeIds));
  for (const e of edges) {
    if (e.relationship !== 'influenced' && AI_TOOL_IDS.has(e.to_language)) ids.add(e.from_language);
  }
  return ids;
}

/** The parts of an explainer file the explorer's path overlay needs. */
export interface OverlayPathFile extends PathShape {
  slug: string;
  steps: Array<PathShape['steps'][number] & { kind: string }>;
  name: string;
  dimensions: Array<{ id: string; legend: string; default: string; options: Array<{ value: string; label: string }> }>;
  stages: Array<{ id: string; name: string; lineage_id: string | null }>;
}

// Whole files, split into their own chunks and fetched only when a path is overlaid.
const fileLoaders = import.meta.glob<OverlayPathFile>('../../dataset/ai/*.json', { import: 'default' });
const loaded = new Map<string, Promise<OverlayPathFile | null>>();

export function loadExplainer(slug: string): Promise<OverlayPathFile | null> {
  if (!loaded.has(slug)) {
    const file = Object.keys(slugs).find((f) => slugs[f] === slug);
    loaded.set(slug, file ? fileLoaders[file]() : Promise.resolve(null));
  }
  return loaded.get(slug)!;
}

/** A selection from URL-style params, falling back to each dimension's default for missing or unknown values. */
export function selectionFrom(data: Pick<OverlayPathFile, 'dimensions'>, params: Record<string, string | null | undefined>): Selection {
  const sel = defaultSelection(data);
  for (const d of data.dimensions) {
    const v = params[d.id];
    if (v && d.options.some((o) => o.value === v)) sel[d.id] = v;
  }
  return sel;
}

/**
 * Atlas nodes a selected path passes through, in path order. Only stages
 * with a lineage_id map to the graph; the rest (IRs, kernels, hardware) are explainer-only.
 */
export function overlayNodeIds(data: OverlayPathFile, sel: Selection): string[] {
  const path = activePath(data, sel);
  const steps = data.steps.filter((s) => path.steps.has(stepId(s)));
  // Order by where the main path first reaches each node; fallback arrows (e.g. Inductor
  // falling back to ATen's CUDA kernels) do not move a node ahead of its main-path place.
  const main = shortestDepths(data.stages[0].id, steps.filter((s) => s.kind !== 'falls_back_to'));
  const any = shortestDepths(data.stages[0].id, steps);
  const key = new Map<string, [number, number, number]>();
  data.stages.forEach((st, index) => {
    if (!st.lineage_id || !any.has(st.id)) return;
    const k: [number, number, number] = main.has(st.id) ? [0, main.get(st.id)!, index] : [1, any.get(st.id)!, index];
    const prev = key.get(st.lineage_id);
    if (!prev || k[0] < prev[0] || (k[0] === prev[0] && (k[1] < prev[1] || (k[1] === prev[1] && k[2] < prev[2])))) key.set(st.lineage_id, k);
  });
  return [...key.entries()]
    .sort(([, a], [, b]) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
    .map(([id]) => id);
}

function shortestDepths(start: string, steps: Array<{ from: string; to: string }>): Map<string, number> {
  const depth = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const at = queue.shift()!;
    for (const s of steps) {
      if (s.from === at && !depth.has(s.to)) { depth.set(s.to, depth.get(at)! + 1); queue.push(s.to); }
    }
  }
  return depth;
}
