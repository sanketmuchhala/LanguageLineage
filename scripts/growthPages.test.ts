/**
 * Growth-plan pages: the crawlable homepage fallback and the family-tree guide's
 * data tables. See docs/growth/GROWTH_EXECUTION_PLAN.md (WP-01, WP-02).
 *
 * The homepage is served as a JavaScript shell, so crawlers that do not run
 * JavaScript saw an empty <div id="root">. index.html now carries a static
 * summary inside #root that React replaces on load. These tests keep its links
 * pointing at pages that exist.
 *
 * The family-tree guide's tables are generated from the dataset. The tests
 * recompute the expected rows independently so a generator change that drops
 * a language, invents a source, or prints a stale count fails here.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

interface Rel {
  from_language: string;
  to_language: string;
  relationship: string;
  start_year?: number | null;
  end_year?: number | null;
  evidence_source?: string;
}
interface Node { id: string; name: string }

const dataset = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const nodes = dataset.languages as Node[];
const rels = dataset.relationships as Rel[];
const nameOf = new Map(nodes.map((n) => [n.id, n.name]));

const SPA_ROUTES = new Set(['/', '/explore', '/embed']);

function internalHrefs(html: string): string[] {
  return [...html.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1]);
}

function pageExists(path: string): boolean {
  if (SPA_ROUTES.has(path)) return true;
  return existsSync(join(ROOT, 'public', path.replace(/^\//, ''), 'index.html'));
}

describe('homepage static fallback (index.html)', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const root = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script type="module"/)?.[1] ?? '';

  it('puts readable content inside #root for crawlers without JavaScript', () => {
    expect(root).toContain('id="static-home"');
    expect(root.match(/<h1>/g)?.length).toBe(1);
    expect(root.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length).toBeGreaterThan(150);
  });

  it('hides the fallback once JavaScript runs, so users see the React page', () => {
    expect(html).toContain("document.documentElement.classList.add('js')");
    expect(html).toMatch(/\.js #static-home\s*\{\s*display:\s*none;?\s*\}/);
  });

  it('links only to pages that exist', () => {
    const hrefs = internalHrefs(root);
    expect(hrefs.length).toBeGreaterThan(10);
    const missing = hrefs.filter((h) => !pageExists(h));
    expect(missing).toEqual([]);
  });

  it('does not add a canonical tag (react-helmet-async sets it per route)', () => {
    expect(html).not.toContain('rel="canonical"');
  });
});

describe('family-tree guide data tables', () => {
  const html = readFileSync(join(ROOT, 'public/guides/programming-language-family-tree/index.html'), 'utf8');
  const table = (id: string) => html.match(new RegExp(`<table[^>]*id="${id}"[\\s\\S]*?</table>`))?.[0] ?? '';

  it('lists each relationship type with its count from the dataset', () => {
    const kinds = table('relationship-kinds');
    expect(kinds).not.toBe('');
    const types = [...new Set(rels.map((r) => r.relationship))];
    for (const type of types) {
      const count = rels.filter((r) => r.relationship === type).length;
      const slug = type.replace(/_/g, '-');
      expect(kinds).toMatch(new RegExp(`<td>${count}</td><td><a href="/relationships/${slug}">`));
    }
  });

  it('lists every dated self-hosting transition in the dataset, and only those', () => {
    const expected = rels
      .filter((r) => r.relationship === 'compiler_written_in' && r.from_language === r.to_language && r.start_year != null)
      .filter((self) => rels.some((r) => r.relationship === 'compiler_written_in' && r.to_language === self.to_language
        && r.from_language !== self.to_language && r.end_year != null))
      .map((self) => ({ id: self.to_language, since: self.start_year }));

    const transitions = table('self-hosting-transitions');
    const rows = transitions.match(/<tr><td>[\s\S]*?<\/tr>/g) ?? [];
    expect(rows.length).toBe(expected.length);
    for (const { id, since } of expected) {
      const row = rows.find((r) => r.startsWith(`<tr><td><a href="/${id.startsWith('tool:') ? 'tools' : 'languages'}/`)
        && r.includes(`>${nameOf.get(id)}</a></td>`));
      expect(row, `missing row for ${id}`).toBeDefined();
      expect(row).toContain(`<td>${since}</td>`);
    }
  });

  it('cites only evidence URLs that exist in the dataset', () => {
    const transitions = table('self-hosting-transitions');
    const external = [...transitions.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    expect(external.length).toBeGreaterThan(0);
    const known = new Set(rels.map((r) => r.evidence_source));
    expect(external.filter((u) => !known.has(u))).toEqual([]);
  });

  it('does not print a stale influence total in the figure caption', () => {
    const influenced = rels.filter((r) => r.relationship === 'influenced').length;
    expect(html).toContain(`has all ${influenced}.`);
  });

  it('links its internal references to pages that exist', () => {
    const missing = internalHrefs(table('relationship-kinds') + table('self-hosting-transitions')).filter((h) => !pageExists(h));
    expect(missing).toEqual([]);
  });
});

describe('compiler bootstrapping guide', () => {
  const html = readFileSync(join(ROOT, 'public/guides/what-is-compiler-bootstrapping/index.html'), 'utf8');
  const familyTree = readFileSync(join(ROOT, 'public/guides/programming-language-family-tree/index.html'), 'utf8');
  const tableOf = (page: string) => page.match(/<table[^>]*id="self-hosting-transitions"[\s\S]*?<\/table>/)?.[0] ?? '';

  it('carries the same generated self-hosting table as the family-tree guide', () => {
    expect(tableOf(html)).not.toBe('');
    expect(tableOf(html)).toBe(tableOf(familyTree));
  });

  it('draws only compiler edges that exist in the dataset, with their years', () => {
    const svg = html.match(/<svg[^>]*aria-label="Compiler implementation language over time[\s\S]*?<\/svg>/)?.[0] ?? '';
    expect(svg).not.toBe('');
    const compiler = rels.filter((r) => r.relationship === 'compiler_written_in');
    const boxes = [...svg.matchAll(/class="sh-(?:node|self)">([^<]+)<\/text><text[^>]*class="sh-year">([^<]+)<\/text>/g)]
      .map((m) => ({ names: m[1].replace(/&amp;/g, '&').split(' + '), years: m[2] }));
    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      for (const name of box.names) {
        const ids = nodes.filter((n) => n.name === name).map((n) => n.id);
        const match = compiler.some((r) => ids.includes(r.from_language) && (
          box.years === `since ${r.start_year}` || box.years === `${r.start_year}–${r.end_year}`));
        expect(match, `${name} ${box.years} is not a dataset compiler edge`).toBe(true);
      }
    }
  });

  it('no longer ships the hand-drawn Rust/Go figure that mislabeled its edges', () => {
    expect(html).not.toContain('Bootstrap chains for Rust and Go');
  });
});
