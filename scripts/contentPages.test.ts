import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { discoverAutoQuestions, idToPrefix, idToSlug, QUESTION_CANONICAL_TO_LANG } from './contentPages';
import { loadAllPaths } from './aiPaths';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const data = JSON.parse(read('dataset/v5/lineage_v5.json'));
const enrichment = JSON.parse(read('dataset/v5/enrichment_v5.json')).enrichment;
const sitemap = read('public/sitemap.xml');

it('discovers a new eligible record without a slug allowlist', () => {
  const node = { id: 'lang:new_fixture_language' };
  const edge = { to_language: node.id, relationship: 'compiler_written_in' };
  expect(discoverAutoQuestions([node], [edge], { [node.id]: {} })).toEqual([{ node, implEdges: [edge] }]);
  expect(idToSlug(node.id)).toBe('new-fixture-language');
});

it('requires implementation evidence and enrichment and preserves editorial exclusions', () => {
  const nodes = ['lang:new', 'tool:new', 'lang:python'].map(id => ({ id }));
  const edges = nodes.map(node => ({ to_language: node.id, relationship: 'compiler_written_in' }));
  const facts = Object.fromEntries(nodes.map(node => [node.id, {}]));
  expect(discoverAutoQuestions(nodes, edges, {})).toEqual([]);
  expect(discoverAutoQuestions(nodes, [], facts)).toEqual([]);
  expect(discoverAutoQuestions(nodes, edges.map(edge => ({ ...edge, relationship: 'influenced' })), facts)).toEqual([]);
  expect(discoverAutoQuestions(nodes, edges, facts).map(q => q.node.id)).toEqual(['lang:new']);
});

describe('dataset-driven publishing coverage', () => {
  it('publishes a page, canonical sitemap entry and social image for every lineage node', () => {
    for (const node of data.languages) {
      const slug = idToSlug(node.id);
      const path = `/${idToPrefix(node.id)}/${slug}`;
      expect(read(`public${path}/index.html`)).toContain(`rel="canonical" href="https://www.languagelineage.org${path}"`);
      expect(sitemap).toContain(`<loc>https://www.languagelineage.org${path}</loc>`);
      expect(existsSync(join(ROOT, 'public/og', `${idToPrefix(node.id)}-${slug}.png`))).toBe(true);
    }
  });

  it('keeps eligible question pages and sitemap canonical decisions in agreement', () => {
    for (const { node } of discoverAutoQuestions(data.languages, data.relationships, enrichment)) {
      const slug = idToSlug(node.id);
      const path = `/questions/what-is-${slug}-written-in`;
      expect(existsSync(join(ROOT, `public${path}/index.html`))).toBe(true);
      expect(sitemap.includes(`<loc>https://www.languagelineage.org${path}</loc>`)).toBe(!QUESTION_CANONICAL_TO_LANG.has(slug));
    }
  });

  it('discovers AI pages in the hub, sitemap, catalog and social images', () => {
    const hub = read('public/ai/index.html');
    const catalog = read('public/llms.txt');
    for (const page of loadAllPaths(ROOT)) {
      const path = `/ai/${page.slug}`;
      expect(read(`public${path}/index.html`)).toContain(page.h1);
      expect(hub).toContain(`href="${path}"`);
      expect(sitemap).toContain(`<loc>https://www.languagelineage.org${path}</loc>`);
      expect(catalog).toContain(`https://www.languagelineage.org${path}`);
      expect(existsSync(join(ROOT, 'public/og', `ai-${page.slug}.png`))).toBe(true);
    }
  });
});
