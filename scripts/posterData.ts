/**
 * The implementation family-tree poster: every language and tool, grouped under
 * the language its current compiler or runtime is written in. Pure functions with
 * no side effects, shared by:
 *   scripts/generatePoster.ts     writes the SVG and PNG files
 *   scripts/generateSeoPages.ts   writes the poster page and its text version
 *   scripts/poster.test.ts        checks every drawn item against the dataset
 *
 * Only current edges (no end_year) of the implementation types are drawn, so a
 * historical answer (Go's compiler in C until 2015) never appears as current.
 */

export interface PosterNode { id: string; name: string }
export interface PosterEdge {
  from_language: string;
  to_language: string;
  relationship: string;
  end_year?: number | null;
}
export interface PosterItem { id: string; name: string; tool: boolean }
export interface PosterGroup { implId: string | null; title: string; items: PosterItem[]; selfHosted: boolean }
export interface PosterMinorPair { item: PosterItem; implName: string; implId: string }
export interface PosterModel { groups: PosterGroup[]; minor: PosterMinorPair[]; edgeCount: number; nodeCount: number }

export const POSTER_TYPES = new Set(['compiler_written_in', 'runtime_written_in', 'rewritten_in']);
export const POSTER_MIN_GROUP = 3;
export const POSTER_SLUG = 'programming-language-implementation-family-tree';

export function buildPosterModel(nodes: PosterNode[], edges: PosterEdge[]): PosterModel {
  const name = new Map(nodes.map((n) => [n.id, n.name]));
  const item = (id: string): PosterItem => ({ id, name: name.get(id) ?? id, tool: id.startsWith('tool:') });
  const byName = (a: PosterItem, b: PosterItem) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });

  const current = edges.filter((e) => POSTER_TYPES.has(e.relationship) && e.end_year == null);
  const selfIds = [...new Set(current.filter((e) => e.from_language === e.to_language).map((e) => e.to_language))];
  const byImpl = new Map<string, Set<string>>();
  for (const e of current) {
    if (e.from_language === e.to_language) continue;
    byImpl.set(e.from_language, (byImpl.get(e.from_language) ?? new Set()).add(e.to_language));
  }

  const groups: PosterGroup[] = [];
  const minor: PosterMinorPair[] = [];
  for (const [implId, targets] of byImpl) {
    const items = [...targets].map(item).sort(byName);
    if (items.length >= POSTER_MIN_GROUP) {
      groups.push({ implId, title: name.get(implId) ?? implId, items, selfHosted: false });
    } else {
      for (const it of items) minor.push({ item: it, implName: name.get(implId) ?? implId, implId });
    }
  }
  groups.push({ implId: null, title: 'Self-hosted', items: selfIds.map(item).sort(byName), selfHosted: true });
  groups.sort((a, b) => b.items.length - a.items.length || a.title.localeCompare(b.title));
  minor.sort((a, b) => byName(a.item, b.item) || a.implName.localeCompare(b.implName));

  const drawn = new Set<string>();
  for (const e of current) { drawn.add(e.from_language); drawn.add(e.to_language); }
  return { groups, minor, edgeCount: current.length, nodeCount: drawn.size };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface PosterMeta { datasetVersion: string; url: string; totalNodes: number; totalEdges: number }

export const POSTER_WIDTH = 1600;

export function buildPosterSvg(model: PosterModel, meta: PosterMeta): string {
  const W = POSTER_WIDTH, M = 60, COLS = 4, GAP = 24;
  const colW = (W - 2 * M - (COLS - 1) * GAP) / COLS;
  const PAD = 20, HEAD = 56, LINE = 24, ITEM_COLS = 2;
  const top = 250;
  const colY = Array(COLS).fill(top);
  const cards: string[] = [];

  const place = (h: number) => {
    const c = colY.indexOf(Math.min(...colY));
    const pos = { x: M + c * (colW + GAP), y: colY[c] };
    colY[c] += h + GAP;
    return pos;
  };

  for (const g of model.groups) {
    const rows = Math.ceil(g.items.length / ITEM_COLS);
    const h = HEAD + rows * LINE + PAD;
    const { x, y } = place(h);
    const stroke = g.selfHosted ? '#4ade80' : '#2a2a2a';
    const parts = [
      `<rect x="${x}" y="${y}" width="${colW}" height="${h}" rx="10" fill="#0d0d0d" stroke="${stroke}" stroke-width="${g.selfHosted ? 2 : 1}"/>`,
      `<text x="${x + PAD}" y="${y + 36}" class="ph">${esc(g.selfHosted ? 'Self-hosted' : `Written in ${g.title}`)}</text>`,
      `<text x="${x + colW - PAD}" y="${y + 36}" class="pc">${g.items.length}</text>`,
    ];
    const itemW = (colW - 2 * PAD) / ITEM_COLS;
    g.items.forEach((it, i) => {
      const ix = x + PAD + (i % ITEM_COLS) * itemW;
      const iy = y + HEAD + Math.floor(i / ITEM_COLS) * LINE + 14;
      parts.push(`<text x="${ix}" y="${iy}" class="${it.tool ? 'pt' : 'pi'}">${esc(it.name)}</text>`);
    });
    cards.push(parts.join(''));
  }

  if (model.minor.length) {
    const h = HEAD + model.minor.length * LINE + PAD;
    const { x, y } = place(h);
    const parts = [
      `<rect x="${x}" y="${y}" width="${colW}" height="${h}" rx="10" fill="#0d0d0d" stroke="#2a2a2a" stroke-width="1"/>`,
      `<text x="${x + PAD}" y="${y + 36}" class="ph">Everything else</text>`,
      `<text x="${x + colW - PAD}" y="${y + 36}" class="pc">${model.minor.length}</text>`,
    ];
    model.minor.forEach((p, i) => {
      const iy = y + HEAD + i * LINE + 14;
      parts.push(`<text x="${x + PAD}" y="${iy}" class="${p.item.tool ? 'pt' : 'pi'}">${esc(p.item.name)}<tspan class="pm" dx="10">in ${esc(p.implName)}</tspan></text>`);
    });
    cards.push(parts.join(''));
  }

  const H = Math.max(...colY) - GAP + 130;
  const footY = H - 74;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="poster-title poster-desc">
<title id="poster-title">What programming languages are written in</title>
<desc id="poster-desc">Languages and tools grouped by the language their current compiler or runtime is written in, from the Language Lineage dataset v${esc(meta.datasetVersion)}. ${model.edgeCount} current implementation relationships. ${esc(meta.url)}</desc>
<style>
  text{font-family:'JetBrains Mono',ui-monospace,monospace}
  .pt1{font-family:'Fraunces 9pt SemiBold','Fraunces 9pt',Fraunces,Georgia,serif;font-size:60px;font-weight:600;fill:#fafafa}
  .ps{font-size:20px;fill:#9a9a9a}
  .pk{font-size:16px;fill:#9a9a9a}
  .ph{font-size:22px;font-weight:600;fill:#4ade80}
  .pc{font-size:20px;fill:#767676;text-anchor:end}
  .pi{font-size:16px;fill:#e5e5e5}
  .pt{font-size:16px;fill:#8f8f8f}
  .pm{fill:#767676}
  .pf{font-size:18px;fill:#9a9a9a}
</style>
<rect width="${W}" height="${H}" fill="#000"/>
<text x="${M}" y="110" class="pt1">What programming languages are written in</text>
<text x="${M}" y="160" class="ps">Each card: an implementation language, and the languages and tools whose current compiler or runtime is written in it.</text>
<text x="${M}" y="196" class="pk">White: languages. Grey: tools (compilers, runtimes, engines). Current relationships only; a language can appear in several cards.</text>
${cards.join('\n')}
<text x="${M}" y="${footY}" class="pf">${esc(meta.url)}</text>
<text x="${M}" y="${footY + 30}" class="pf">Language Lineage dataset v${esc(meta.datasetVersion)}  ·  ${meta.totalNodes} nodes  ·  ${meta.totalEdges} cited relationships  ·  CC BY 4.0</text>
</svg>
`;
}
