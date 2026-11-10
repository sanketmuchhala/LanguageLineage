/**
 * The implementation family-tree poster and the guide history tables.
 *
 * The poster is the launch and outreach asset, so a wrong or stale entry is
 * expensive: these tests check that every drawn item is a current, cited
 * implementation edge, and that the committed SVG matches the dataset.
 *
 * When the stale-poster test fails after a dataset change, run
 * `npm run poster:generate` and commit the new SVG and PNGs.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { buildPosterModel, buildPosterSvg, POSTER_SLUG, POSTER_TYPES } from './posterData';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
type Rel = { from_language: string; to_language: string; relationship: string; start_year: number | null; end_year: number | null; evidence_source: string };
const rels = data.relationships as Rel[];
const model = buildPosterModel(data.languages, rels);
const current = rels.filter((r) => POSTER_TYPES.has(r.relationship) && r.end_year == null);

function pageExists(path: string): boolean {
  if (['/', '/explore', '/embed'].includes(path)) return true;
  const p = join(ROOT, 'public', path.replace(/^\//, ''));
  return existsSync(join(p, 'index.html')) || existsSync(p);
}

describe('poster model', () => {
  it('draws only current implementation edges from the dataset', () => {
    for (const g of model.groups) {
      for (const item of g.items) {
        const ok = g.selfHosted
          ? current.some((r) => r.from_language === item.id && r.to_language === item.id)
          : current.some((r) => r.from_language === g.implId && r.to_language === item.id);
        expect(ok, `${g.title} -> ${item.name}`).toBe(true);
      }
    }
    for (const p of model.minor) {
      expect(current.some((r) => r.from_language === p.implId && r.to_language === p.item.id)).toBe(true);
    }
  });

  it('draws every current implementation edge exactly once', () => {
    const drawn = model.groups.reduce((n, g) => n + g.items.length, 0) + model.minor.length;
    const pairs = new Set(current.map((r) => `${r.from_language}>${r.to_language}`));
    expect(drawn).toBe(pairs.size);
  });

  it('never shows an ended edge as current (Go is self-hosted, not under C)', () => {
    const c = model.groups.find((g) => g.implId === 'lang:c');
    const self = model.groups.find((g) => g.selfHosted);
    expect(c?.items.some((i) => i.id === 'lang:go')).toBe(false);
    expect(self?.items.some((i) => i.id === 'lang:go')).toBe(true);
  });
});

describe('poster files', () => {
  const svgPath = join(ROOT, 'public/posters', `${POSTER_SLUG}.svg`);

  it('the committed SVG matches the current dataset (run npm run poster:generate if not)', () => {
    const expected = buildPosterSvg(model, {
      datasetVersion: '5.0',
      url: `https://www.languagelineage.org/posters/${POSTER_SLUG}`,
      totalNodes: data.languages.length,
      totalEdges: rels.length,
    });
    expect(readFileSync(svgPath, 'utf8')).toBe(expected);
  });

  it('ships the PNG and the 1200x630 social card', () => {
    const png = join(ROOT, 'public/posters', `${POSTER_SLUG}.png`);
    const og = join(ROOT, 'public/og', `posters-${POSTER_SLUG}.png`);
    expect(existsSync(png)).toBe(true);
    const head = readFileSync(og).subarray(16, 24);
    expect([head.readUInt32BE(0), head.readUInt32BE(4)]).toEqual([1200, 630]);
  });
});

describe('poster page', () => {
  const html = readFileSync(join(ROOT, 'public/posters', POSTER_SLUG, 'index.html'), 'utf8');

  it('lists every card as text, one row per card or other pair', () => {
    const tbody = html.match(/<h2[^>]*>Every card, as text<\/h2>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? '';
    const rows = tbody.match(/<tr>/g) ?? [];
    expect(rows.length).toBe(model.groups.length + model.minor.length);
  });

  it('links only to files and pages that exist, and is in the sitemap', () => {
    const hrefs = [...html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)].map((m) => m[1]);
    expect(hrefs.filter((h) => !h.startsWith("/_vercel/") && !pageExists(h))).toEqual([]);
    expect(readFileSync(join(ROOT, 'public/sitemap.xml'), 'utf8')).toContain(`/posters/${POSTER_SLUG}</loc>`);
  });
});

describe('guide implementation history tables', () => {
  const cases: Array<[string, string, string[]]> = [
    ['how-rust-is-bootstrapped', 'rust-implementation-history', ['lang:rust', 'tool:mrustc']],
    ['v8-vs-spidermonkey-vs-javascriptcore', 'js-engine-implementation', ['tool:v8', 'tool:spidermonkey', 'tool:javascriptcore', 'tool:quickjs']],
  ];
  const types = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in', 'rewritten_in']);

  it.each(cases)('%s lists every implementation edge for its components with a source', (slug, id, ids) => {
    const html = readFileSync(join(ROOT, 'public/guides', slug, 'index.html'), 'utf8');
    const table = html.match(new RegExp(`<table[^>]*id="${id}"[\\s\\S]*?</table>`))?.[0] ?? '';
    const rows = table.match(/<tr><td>[\s\S]*?<\/tr>/g) ?? [];
    const expected = rels.filter((r) => ids.includes(r.to_language) && types.has(r.relationship));
    expect(rows.length).toBe(expected.length);
    for (const r of expected) expect(table).toContain(`href="${r.evidence_source.replace(/&/g, '&amp;')}"`);
  });
});
