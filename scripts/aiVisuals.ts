/**
 * Cross-explainer visuals for the /ai hub, computed only from dataset/ai/*.json and the
 * lineage dataset. Nothing here is a new claim:
 *
 * - Convergence map: which shared atlas tools and which hardware each explainer's
 *   selectable paths pass through (stage lineage_id and hardware stages).
 * - Path anatomy: the default path of every explainer, stage by stage, coloured by the
 *   layer its data file assigns, with the point where "your code" hands over.
 * - Language matrix: the implementation languages of the atlas tools on each explainer's
 *   stages, from current compiler_written_in / runtime_written_in lineage edges.
 *
 * Pure functions: data in, markup or plain objects out. Rendered by
 * scripts/generateSeoPages.ts; public/ai-hub.js adds highlighting on top of the
 * server-rendered markup.
 */
import { activePath, allSelections, defaultSelection, stepApplies, type Selection } from '../src/data/aiPathLogic.js';
import type { PathsData, StageT } from './aiPaths.js';

export interface LineageRel {
  from_language: string;
  to_language: string;
  relationship: string;
  end_year?: number | null;
}

export interface NodeInfo {
  name: (id: string) => string;
  href: (id: string) => string;
  exists: (id: string) => boolean;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Short label for a selection, e.g. "torch.compile · NVIDIA GPU". */
export function selectionLabel(data: PathsData, sel: Selection): string {
  return data.dimensions.map(d => d.options.find(o => o.value === sel[d.id])!.label).join(' · ');
}

function selectionQuery(sel: Selection): string {
  return '?' + Object.entries(sel).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
}

// ---------------------------------------------------------------------------
// Hardware targets
// ---------------------------------------------------------------------------

/** Group hardware stages that name the same target across files. Unknown names stay as written. */
export function hardwareTarget(stage: Pick<StageT, 'name'>): string {
  const n = stage.name;
  if (/nvidia/i.test(n)) return 'NVIDIA GPU';
  if (/\bamd\b/i.test(n)) return 'AMD GPU';
  if (/apple/i.test(n) && /gpu/i.test(n)) return 'Apple silicon GPU';
  if (/\btpu\b/i.test(n)) return 'Google TPU';
  if (/\bcpu\b/i.test(n)) return 'CPU';
  return n;
}

const HW_ORDER = ['NVIDIA GPU', 'AMD GPU', 'Apple silicon GPU', 'Google TPU', 'CPU'];

// ---------------------------------------------------------------------------
// Convergence map
// ---------------------------------------------------------------------------

export const NO_SHARED_TOOL = 'none';

export interface ConvergencePath {
  token: string;          // "<slug>~<index>", unique per selectable path
  slug: string;
  label: string;          // selection label
  href: string;           // explainer opened on this selection
  tools: string[];        // shared atlas tool ids on the path (or [NO_SHARED_TOOL])
  hardware: string[];     // hardware targets reached
  reach: Record<string, string[]>; // middle-column id -> hardware reachable from it on this path
}

export interface ConvergenceNode {
  id: string;             // "fw:<slug>", "tool:<id>" / "none", "hw:<name>"
  col: 0 | 1 | 2;
  label: string;
  href: string | null;
  tokens: string[];
}

export interface ConvergenceLink { from: string; to: string; tokens: string[] }

export interface ConvergenceModel {
  paths: ConvergencePath[];
  nodes: ConvergenceNode[];
  links: ConvergenceLink[];
  sharedTools: string[];
}

/**
 * Shared tools are tool: lineage nodes that stages in at least two explainers link to.
 * Tools that only one explainer mentions stay out of the middle column so it shows
 * convergence, not every component.
 */
export function buildConvergenceModel(pages: PathsData[], info: NodeInfo): ConvergenceModel {
  const filesPerTool = new Map<string, Set<string>>();
  for (const p of pages) for (const s of p.stages) {
    if (s.lineage_id?.startsWith('tool:') && info.exists(s.lineage_id)) {
      (filesPerTool.get(s.lineage_id) ?? filesPerTool.set(s.lineage_id, new Set()).get(s.lineage_id)!).add(p.slug);
    }
  }
  const shared = new Set([...filesPerTool].filter(([, f]) => f.size >= 2).map(([id]) => id));

  const paths: ConvergencePath[] = pages.flatMap(p => allSelections(p).map((sel, i) => {
    const active = activePath(p, sel);
    const stages = p.stages.filter(s => active.stages.has(s.id));
    const tools = [...new Set(stages.map(s => s.lineage_id).filter((id): id is string => !!id && shared.has(id)))];
    const hardware = [...new Set(stages.filter(s => s.kind === 'hardware').map(hardwareTarget))];
    // A tool links only to the hardware its own stages lead to along this path's steps,
    // so a path that keeps some layers on the CPU does not draw "CUDA -> CPU".
    const steps = p.steps.filter(s => stepApplies(s, sel) && active.stages.has(s.from) && active.stages.has(s.to));
    const byId = new Map(stages.map(s => [s.id, s]));
    const hwFrom = (startIds: string[]) => {
      const seen = new Set(startIds), queue = [...startIds], out = new Set<string>();
      while (queue.length) {
        const id = queue.shift()!;
        const st = byId.get(id)!;
        if (st.kind === 'hardware') out.add(hardwareTarget(st));
        for (const s of steps) if (s.from === id && !seen.has(s.to)) { seen.add(s.to); queue.push(s.to); }
      }
      return out;
    };
    const reach: Record<string, string[]> = {};
    const covered = new Set<string>();
    for (const t of tools) {
      const hw = [...hwFrom(stages.filter(s => s.lineage_id === t).map(s => s.id))];
      reach[t] = hardware.filter(h => hw.includes(h));
      hw.forEach(h => covered.add(h));
    }
    const uncovered = hardware.filter(h => !covered.has(h));
    if (!tools.length || uncovered.length) reach[NO_SHARED_TOOL] = tools.length ? uncovered : hardware;
    const mids = Object.keys(reach).filter(k => reach[k].length);
    return {
      token: `${p.slug}~${i}`,
      slug: p.slug,
      label: selectionLabel(p, sel),
      href: `/ai/${p.slug}${selectionQuery(sel)}`,
      tools: mids.length ? mids : [NO_SHARED_TOOL],
      hardware,
      reach,
    };
  }));

  const nodeMap = new Map<string, ConvergenceNode>();
  const linkMap = new Map<string, ConvergenceLink>();
  const node = (id: string, col: 0 | 1 | 2, label: string, href: string | null) =>
    nodeMap.get(id) ?? nodeMap.set(id, { id, col, label, href, tokens: [] }).get(id)!;
  const link = (from: string, to: string, token: string) => {
    const key = `${from}|${to}`;
    const l = linkMap.get(key) ?? linkMap.set(key, { from, to, tokens: [] }).get(key)!;
    if (!l.tokens.includes(token)) l.tokens.push(token);
  };
  const byslug = new Map(pages.map(p => [p.slug, p]));

  for (const path of paths) {
    const fw = node(`fw:${path.slug}`, 0, byslug.get(path.slug)!.name, `/ai/${path.slug}`);
    fw.tokens.push(path.token);
    for (const t of path.tools) {
      const tn = t === NO_SHARED_TOOL
        ? node(NO_SHARED_TOOL, 1, 'No shared tool', null)
        : node(t, 1, info.name(t), info.href(t));
      if (!tn.tokens.includes(path.token)) tn.tokens.push(path.token);
      link(fw.id, tn.id, path.token);
      for (const h of path.reach[t] ?? path.hardware) link(tn.id, `hw:${h}`, path.token);
    }
    for (const h of path.hardware) {
      const hn = node(`hw:${h}`, 2, h, null);
      if (!hn.tokens.includes(path.token)) hn.tokens.push(path.token);
    }
  }

  // Order: frameworks as given, then middle and right columns by the mean row of what feeds
  // them (one barycentre sweep each way keeps crossings low without a layout library).
  const nodes = [...nodeMap.values()];
  const col = (c: number) => nodes.filter(n => n.col === c);
  const links = [...linkMap.values()];
  const rowOf = new Map<string, number>();
  const setRows = (list: ConvergenceNode[]) => list.forEach((n, i) => rowOf.set(n.id, i));
  const bary = (n: ConvergenceNode, side: 'from' | 'to') => {
    const ls = links.filter(l => (side === 'from' ? l.to : l.from) === n.id);
    const w = ls.reduce((s, l) => s + l.tokens.length, 0) || 1;
    return ls.reduce((s, l) => s + (rowOf.get(side === 'from' ? l.from : l.to) ?? 0) * l.tokens.length, 0) / w;
  };
  let left = col(0);
  setRows(left);
  let mid = col(1).sort((a, b) => bary(a, 'from') - bary(b, 'from') || a.label.localeCompare(b.label));
  // "No shared tool" always sits last in the middle column.
  mid = [...mid.filter(n => n.id !== NO_SHARED_TOOL), ...mid.filter(n => n.id === NO_SHARED_TOOL)];
  setRows(mid);
  const right = col(2).sort((a, b) => {
    const ia = HW_ORDER.indexOf(a.label), ib = HW_ORDER.indexOf(b.label);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.label.localeCompare(b.label);
  });
  setRows(right);
  left = [...left].sort((a, b) => bary(a, 'to') - bary(b, 'to') || a.label.localeCompare(b.label));
  setRows(left);
  mid = [...mid.filter(n => n.id !== NO_SHARED_TOOL)].sort((a, b) => bary(a, 'from') - bary(b, 'from') || a.label.localeCompare(b.label))
    .concat(mid.filter(n => n.id === NO_SHARED_TOOL));

  return { paths, nodes: [...left, ...mid, ...right], links, sharedTools: [...shared].sort() };
}

/** One sentence per node, used as its tooltip and in the detail line under the map. */
export function convergenceSummary(model: ConvergenceModel, n: ConvergenceNode): string {
  const ps = model.paths.filter(p => n.tokens.includes(p.token));
  const nPaths = `${ps.length} documented path${ps.length === 1 ? '' : 's'}`;
  const frameworks = [...new Set(ps.map(p => model.nodes.find(x => x.id === `fw:${p.slug}`)!.label))];
  const tools = [...new Set(ps.flatMap(p => p.tools))].filter(t => t !== NO_SHARED_TOOL)
    .map(t => model.nodes.find(x => x.id === t)!.label);
  const hw = [...new Set(ps.flatMap(p => p.hardware))];
  const list = (xs: string[]) => xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
  if (n.col === 0) {
    return `${n.label}: ${nPaths}, reaching ${list(hw)}${tools.length ? ` through ${list(tools)}` : ' without a tool shared with another explainer'}.`;
  }
  if (n.col === 1) {
    if (n.id === NO_SHARED_TOOL) return `${nPaths} (${list(frameworks)}) ${ps.length === 1 ? 'reaches' : 'reach'} ${list([...new Set(ps.flatMap(p => p.reach[NO_SHARED_TOOL] ?? []))])} without passing a tool that another explainer also uses.`;
    const reached = HW_ORDER.filter(h => ps.some(p => (p.reach[n.id] ?? []).includes(h)))
      .concat([...new Set(ps.flatMap(p => p.reach[n.id] ?? []))].filter(h => !HW_ORDER.includes(h)));
    return `${n.label} is on ${nPaths} from ${list(frameworks)}, leading to ${list(reached)}.`;
  }
  const via = [...new Set(ps.flatMap(p => p.tools.filter(t => t !== NO_SHARED_TOOL && (p.reach[t] ?? []).includes(n.label))))]
    .map(t => model.nodes.find(x => x.id === t)!.label);
  return `${n.label} is reached by ${nPaths} from ${list(frameworks)}${via.length ? `, through ${list(via)}` : ''}.`;
}

export const CONV = { W: 980, COL_X: [0, 395, 790], NODE_W: 190, ROW: 40, NODE_H: 30, TOP: 34 };

/** Server-rendered SVG. Links carry the tokens of the paths that use them. */
export function buildConvergenceSvg(model: ConvergenceModel): string {
  const { W, COL_X, NODE_W, ROW, NODE_H, TOP } = CONV;
  const cols = [0, 1, 2].map(c => model.nodes.filter(n => n.col === c));
  const maxRows = Math.max(...cols.map(c => c.length));
  const H = TOP + maxRows * ROW + 8;
  const pos = new Map<string, { x: number; y: number }>();
  cols.forEach((list, c) => {
    const offset = ((maxRows - list.length) * ROW) / 2;
    list.forEach((n, i) => pos.set(n.id, { x: COL_X[c], y: TOP + offset + i * ROW }));
  });
  const maxTokens = Math.max(...model.links.map(l => l.tokens.length));
  const colour = (n: ConvergenceNode) => n.col === 0 ? '#e3a008' : n.col === 2 ? '#4ade80' : n.id === NO_SHARED_TOOL ? '#767676' : '#a78bfa';

  const links = model.links.map(l => {
    const a = pos.get(l.from)!, b = pos.get(l.to)!;
    const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2, x2 = b.x, y2 = b.y + NODE_H / 2;
    const mx = (x1 + x2) / 2;
    const w = (1.5 + (l.tokens.length / maxTokens) * 7).toFixed(1);
    return `<path class="cv-link" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" stroke-width="${w}" data-tokens="${l.tokens.join(' ')}"><title>${l.tokens.length} path${l.tokens.length === 1 ? '' : 's'}</title></path>`;
  }).join('\n');

  const nodes = model.nodes.map(n => {
    const { x, y } = pos.get(n.id)!;
    const c = colour(n);
    const summary = convergenceSummary(model, n);
    const label = `<text x="${x + 12}" y="${y + 19}" class="cv-name">${esc(n.label)}</text><text x="${x + NODE_W - 10}" y="${y + 19}" class="cv-count" text-anchor="end">${n.tokens.length}</text>`;
    const body = `<rect x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="6" style="--cc:${c}"/><rect x="${x}" y="${y}" width="4" height="${NODE_H}" rx="2" fill="${c}"/>${label}`;
    const attrs = `class="cv-node" id="cv-${esc(n.id.replace(/[^a-z0-9]+/gi, '-'))}" data-tokens="${n.tokens.join(' ')}" data-summary="${esc(summary)}"`;
    return n.href
      ? `<a href="${esc(n.href)}" ${attrs} aria-label="${esc(summary)}"><title>${esc(summary)}</title>${body}</a>`
      : `<g ${attrs} tabindex="0" role="button" aria-label="${esc(summary)}"><title>${esc(summary)}</title>${body}</g>`;
  }).join('\n');

  const heads = ['Explainer', 'Shared tool on the path', 'Hardware reached']
    .map((t, i) => `<text x="${COL_X[i]}" y="16" class="cv-head">${t}</text>`).join('');

  return `<svg class="cv-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Convergence map: AI explainers, the shared tools their paths pass through, and the hardware they reach">
${heads}
<g class="cv-links">
${links}
</g>
${nodes}
</svg>`;
}

// ---------------------------------------------------------------------------
// Path anatomy: default path of each explainer, stage by stage
// ---------------------------------------------------------------------------

export const LAYER_STYLE: Record<string, { label: string; color: string }> = {
  python: { label: 'Your code (Python)', color: '#60a5fa' },
  application: { label: 'Your application', color: '#93c5fd' },
  framework: { label: 'Framework', color: '#e3a008' },
  compiler: { label: 'Compiler and IR', color: '#a78bfa' },
  kernel: { label: 'Kernels', color: '#f472b6' },
  hardware: { label: 'Hardware', color: '#4ade80' },
};
const USER_LAYERS = new Set(['python', 'application']);

/**
 * Stages of one selection in execution order: each stage sits after the longest chain of
 * applying steps that leads to it from the first stage, so hardware comes after every
 * compiler stage that targets it. Steps that close a loop (SGLang's detokenizer handing
 * back to the tokenizer manager) are found by a depth-first walk and ignored for ordering.
 */
export function orderedPath(data: PathsData, sel: Selection): { main: StageT[]; side: StageT[] } {
  const active = activePath(data, sel);
  const start = data.stages[0].id;
  const steps = data.steps.filter(s => stepApplies(s, sel) && active.stages.has(s.from) && active.stages.has(s.to));
  const back = new Set<typeof steps[number]>();
  const onStack = new Set<string>(), seen = new Set<string>();
  const visit = (id: string) => {
    seen.add(id); onStack.add(id);
    for (const s of steps) if (s.from === id) {
      if (onStack.has(s.to)) back.add(s);
      else if (!seen.has(s.to)) visit(s.to);
    }
    onStack.delete(id);
  };
  visit(start);
  const dag = steps.filter(s => !back.has(s));
  const depth = new Map<string, number>([[start, 0]]);
  for (let i = 0; i < active.stages.size; i++) {
    let changed = false;
    for (const s of dag) {
      const d = depth.get(s.from);
      if (d !== undefined && d + 1 > (depth.get(s.to) ?? -1)) { depth.set(s.to, d + 1); changed = true; }
    }
    if (!changed) break;
  }
  const ordered = data.stages.filter(s => depth.has(s.id))
    .sort((a, b) => depth.get(a.id)! - depth.get(b.id)! || a.pos[1] - b.pos[1] || a.pos[0] - b.pos[0]);
  // Main chain: stages that lead to hardware. The rest (a cache lookup, a detokenizer that
  // hands results back, post-processing) are side branches whose position along the chain
  // the data does not state; they follow the chain, marked as such.
  const leadsToHw = new Set(data.stages.filter(s => s.kind === 'hardware' && depth.has(s.id)).map(s => s.id));
  for (let changed = true; changed;) {
    changed = false;
    for (const s of dag) if (leadsToHw.has(s.to) && !leadsToHw.has(s.from)) { leadsToHw.add(s.from); changed = true; }
  }
  return { main: ordered.filter(s => leadsToHw.has(s.id)), side: ordered.filter(s => !leadsToHw.has(s.id)) };
}

export interface AnatomyRow {
  slug: string;
  name: string;
  label: string;
  href: string;
  stages: StageT[];       // main chain, in execution order
  side: StageT[];         // side branches, order along the chain not stated by the data
  handoff: number;        // index of the first stage outside the user's own code
  layers: Record<string, number>;
}

export function buildAnatomy(pages: PathsData[]): AnatomyRow[] {
  return pages.map(p => {
    const sel = defaultSelection(p);
    const { main: stages, side } = orderedPath(p, sel);
    const handoff = Math.max(0, stages.findIndex(s => !USER_LAYERS.has(s.layer)));
    const layers: Record<string, number> = {};
    for (const s of [...stages, ...side]) layers[s.layer] = (layers[s.layer] ?? 0) + 1;
    return { slug: p.slug, name: p.name, label: selectionLabel(p, sel), href: `/ai/${p.slug}${selectionQuery(sel)}`, stages, side, handoff, layers };
  });
}

export function buildAnatomyHtml(rows: AnatomyRow[]): string {
  const body = rows.map(r => {
    const cell = (s: StageT, side: boolean) => {
      const st = LAYER_STYLE[s.layer];
      const tip = `${s.name}: ${st.label.toLowerCase()}${side ? ', beside the main path' : ''}`;
      return `<li class="an-cell${side ? ' an-side' : ''}" data-layer="${s.layer}" style="--lc:${st.color}" title="${esc(tip)}"><span class="an-label">${esc(s.name)}</span><span class="sr-only">, ${esc(st.label)}${side ? ', beside the main path' : ''}</span></li>`;
    };
    const cells = r.stages.map((s, i) => `${i === r.handoff && i > 0 ? '<li class="an-handoff" aria-hidden="true"></li>' : ''}${cell(s, false)}`).join('')
      + (r.side.length ? `<li class="an-sidebreak" aria-hidden="true"></li>${r.side.map(s => cell(s, true)).join('')}` : '');
    return `<li class="an-row" data-layers="${esc(Object.keys(r.layers).join(' '))}">
<a class="an-name" href="${esc(r.href)}">${esc(r.name)}<span class="an-sel">${esc(r.label)}</span></a>
<ol class="an-cells" aria-label="${esc(`${r.name}, ${r.stages.length + r.side.length} stages`)}">${cells}</ol>
<span class="an-total">${r.stages.length + r.side.length}</span>
</li>`;
  }).join('\n');
  const legend = Object.entries(LAYER_STYLE).map(([k, v]) =>
    `<li><button type="button" class="an-filter" data-layer="${k}" aria-pressed="false"><span class="ai-swatch" style="--kc:${v.color}"></span>${esc(v.label)}</button></li>`).join('');
  return `<div class="an-wrap" id="ai-anatomy">
<ul class="an-legend" aria-label="Layers (select one to highlight it)">${legend}<li class="an-legend-handoff"><span class="an-handoff-key" aria-hidden="true"></span>Your code hands over</li><li class="an-legend-handoff"><span class="an-side-key" aria-hidden="true"></span>Beside the main path</li></ul>
<ol class="an-rows">
${body}
</ol>
</div>`;
}

// ---------------------------------------------------------------------------
// Language matrix: what the atlas tools on each explainer are written in
// ---------------------------------------------------------------------------

const IMPL_TYPES = new Set(['compiler_written_in', 'runtime_written_in']);

export interface LanguageCell { lang: string; tools: string[] }
export interface LanguageMatrix { languages: string[]; rows: Array<{ slug: string; name: string; cells: Map<string, string[]> }> }

/**
 * The atlas tools behind one explainer: every tool: node a stage links to, plus the
 * explainer's own tool when its link_from list names a tool with the explainer's name
 * (ONNX Runtime's stages link to C++ directly, but the page is about tool:onnx_runtime).
 */
export function explainerTools(p: PathsData, info: NodeInfo): string[] {
  const own = p.link_from.filter(id => id.startsWith('tool:') && info.exists(id) && info.name(id).toLowerCase() === p.name.toLowerCase());
  return [...new Set([...own, ...p.stages.map(s => s.lineage_id).filter((id): id is string => !!id && id.startsWith('tool:') && info.exists(id))])];
}

/**
 * For each explainer: its atlas tools, and for each tool the lang: nodes on current
 * (end_year null) compiler_written_in / runtime_written_in edges into it. Stages that
 * link straight to a language are not counted: "CPython interpreter -> Python" names the
 * language being run, not what the stage is written in.
 */
export function buildLanguageMatrix(pages: PathsData[], rels: LineageRel[], info: NodeInfo): LanguageMatrix {
  const writtenIn = (tool: string) => [...new Set(rels
    .filter(r => r.to_language === tool && IMPL_TYPES.has(r.relationship) && r.end_year == null && r.from_language.startsWith('lang:'))
    .map(r => r.from_language))];
  const totals = new Map<string, number>();
  const rows = pages.map(p => {
    const cells = new Map<string, string[]>();
    for (const tool of explainerTools(p, info)) for (const lang of writtenIn(tool)) {
      if (!info.exists(lang)) continue;
      const list = cells.get(lang) ?? cells.set(lang, []).get(lang)!;
      if (!list.includes(info.name(tool))) list.push(info.name(tool));
    }
    for (const [lang, who] of cells) totals.set(lang, (totals.get(lang) ?? 0) + who.length);
    return { slug: p.slug, name: p.name, cells };
  });
  const languages = [...totals.keys()].sort((a, b) => totals.get(b)! - totals.get(a)! || info.name(a).localeCompare(info.name(b)));
  return { languages, rows };
}

export function buildLanguageTable(m: LanguageMatrix, info: NodeInfo, colorOf: (id: string) => string): string {
  const max = Math.max(1, ...m.rows.flatMap(r => [...r.cells.values()].map(v => v.length)));
  const head = m.languages.map(l => `<th scope="col"><a href="${esc(info.href(l))}">${esc(info.name(l))}</a></th>`).join('');
  const body = m.rows.map(r => `<tr><th scope="row"><a href="/ai/${r.slug}">${esc(r.name)}</a></th>${m.languages.map(l => {
    const who = r.cells.get(l);
    if (!who) return '<td><span class="lm-none" aria-label="none">&middot;</span></td>';
    const size = Math.round(12 + (who.length / max) * 18);
    const text = `${info.name(l)}: ${who.join(', ')}`;
    return `<td><span class="lm-dot" style="--lc:${colorOf(l)};--ls:${size}px" title="${esc(text)}" aria-hidden="true"></span><span class="sr-only">${esc(text)}</span></td>`;
  }).join('')}</tr>`).join('\n');
  return `<div class="lm-scroll" role="region" aria-label="Languages by explainer" tabindex="0"><table id="ai-language-matrix" class="lm-table">
<thead><tr><th scope="col">Explainer</th>${head}</tr></thead>
<tbody>
${body}
</tbody>
</table></div>`;
}
