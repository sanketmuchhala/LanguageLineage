/**
 * Which stages and steps of an AI execution-path file a selection passes through.
 * Pure and dependency-free, so both the page generator (scripts/aiPaths.ts re-exports
 * these) and the graph explorer's path overlay use the same rules.
 *
 * A step applies to a selection when, for every dimension it lists in `when`, the
 * selected value is one of the listed values; dimensions it omits apply to all values.
 */
export type Selection = Record<string, string>;

export interface PathShape {
  dimensions: Array<{ id: string; default: string; options: Array<{ value: string }> }>;
  stages: Array<{ id: string }>;
  steps: Array<{ from: string; to: string; when: Record<string, string[]> }>;
}

type Step = PathShape['steps'][number];

export const stepId = (s: Pick<Step, 'from' | 'to'>) => `${s.from}--${s.to}`;

export function defaultSelection(data: Pick<PathShape, 'dimensions'>): Selection {
  return Object.fromEntries(data.dimensions.map(d => [d.id, d.default]));
}

/** Every combination of dimension values. */
export function allSelections(data: Pick<PathShape, 'dimensions'>): Selection[] {
  return data.dimensions.reduce<Selection[]>((acc, d) => acc.flatMap(sel => d.options.map(o => ({ ...sel, [d.id]: o.value }))), [{}]);
}

export function stepApplies(s: Pick<Step, 'when'>, sel: Selection): boolean {
  return Object.entries(s.when).every(([dim, values]) => values.includes(sel[dim]));
}

/** The stages and steps reachable from the first stage under one selection. */
export function activePath(data: PathShape, sel: Selection): { stages: Set<string>; steps: Set<string> } {
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
