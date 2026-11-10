/**
 * Source-type labels (scripts/sourceType.ts) shown beside every evidence link.
 * A wrong label misstates how strong a citation is, so the mapping is pinned
 * here with real URLs from the dataset, and the generated pages are checked for
 * a labeled source on every relationship row.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect } from 'vitest';
import { sourceKind, sourceLabel, SOURCE_LABELS } from './sourceType';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const rels = data.relationships as Array<{ relationship: string; evidence_source: string }>;

describe('sourceKind', () => {
  it.each([
    ['https://en.wikipedia.org/wiki/BCPL', 'wikipedia'],
    ['https://github.com/rust-lang/rust', 'repository'],
    ['https://gitlab.haskell.org/ghc/ghc', 'repository'],
    ['https://fsharp.org/history/hopl-final/hopl-fsharp.pdf', 'paper'],
    ['https://www.microsoft.com/en-us/research/wp-content/uploads/2016/07/history.pdf', 'paper'],
    ['https://forums.swift.org/t/self-hosting-swift/', 'forum'],
    ['https://discourse.julialang.org/t/the-role-of-femtolisp-in-julia/', 'forum'],
    ['https://lwn.net/Articles/542457/', 'article'],
    ['https://gist.github.com/rtfeldman/77fb430ee57b42f5f2ca973a3992532f', 'other'],
    ['https://go.dev/doc/go1.5', 'docs'],
    ['https://reasonml.github.io/', 'docs'],
    ['not a url', 'other'],
  ])('%s -> %s', (url, kind) => {
    expect(sourceKind(url)).toBe(kind);
  });

  it('labels every evidence URL in the dataset with a known label', () => {
    const labels = new Set(Object.values(SOURCE_LABELS));
    for (const r of rels) expect(labels.has(sourceLabel(r.evidence_source))).toBe(true);
  });
});

describe('generated pages show a labeled source', () => {
  it('every row of every /relationships/ page links its evidence with a source type', () => {
    const types = [...new Set(rels.map((r) => r.relationship))];
    for (const type of types) {
      const html = readFileSync(join(ROOT, 'public/relationships', type.replace(/_/g, '-'), 'index.html'), 'utf8');
      const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? '';
      const rows = tbody.match(/<tr>[\s\S]*?<\/tr>/g) ?? [];
      expect(rows.length, type).toBe(rels.filter((r) => r.relationship === type).length);
      for (const row of rows) {
        const link = row.match(/<a href="(https?:[^"]+)"[^>]*>([^<]+)<\/a><\/td>\s*<\/tr>$/);
        expect(link, `${type}: row without a source link`).not.toBeNull();
        expect(link![2]).toBe(sourceLabel(link![1].replace(/&amp;/g, '&')));
      }
    }
  });

  it('the evidence list on a language page labels each URL', () => {
    const html = readFileSync(join(ROOT, 'public/languages/rust/index.html'), 'utf8');
    const list = html.match(/<ul class="source-list">([\s\S]*?)<\/ul>/)?.[1] ?? '';
    const items = list.match(/<li>[\s\S]*?<\/li>/g) ?? [];
    const evidence = items.filter((li) => !/on Wiki(pedia|data)/.test(li));
    expect(evidence.length).toBeGreaterThan(0);
    for (const li of evidence) expect(li).toMatch(/<span class="src-type">[^<]+<\/span><\/li>$/);
  });
});
