/**
 * The AI execution-path explainers (dataset/ai/*.json, published at /ai/<slug>) as the
 * graph explorer needs them: which atlas nodes each explainer's stages link to.
 *
 * Read at build time with import.meta.glob and only the fields used here, so there is
 * no extra request and no hand-kept list of "AI" nodes: a tool counts as AI
 * infrastructure exactly when an explainer has a stage linked to it.
 */
import type { RawEdge } from './types';

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
 * Nodes shown by the explorer's AI infrastructure filter: the AI tools plus what they
 * are implemented in (sources of their non-influence edges), so the view answers
 * "what is this AI stack written in?". Influence edges are left out on purpose.
 */
export function aiViewNodeIds(edges: Pick<RawEdge, 'from_language' | 'to_language' | 'relationship'>[]): Set<string> {
  const ids = new Set<string>(AI_TOOL_IDS);
  for (const e of edges) {
    if (e.relationship !== 'influenced' && AI_TOOL_IDS.has(e.to_language)) ids.add(e.from_language);
  }
  return ids;
}
