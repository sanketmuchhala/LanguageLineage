import { describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ToolArticleSchema, loadToolArticles, renderToolArticle, renderToolParagraph } from './toolArticles';

const paragraph = { text: '<script>alert("x")</script>', sources: ['docs'] };
const record = { node_id: 'tool:cuda', introduction: paragraph,
  sections: ['What it does', 'How it works', 'Where it fits'].map(heading => ({ heading, paragraphs: [paragraph] })),
  sources: [{ id: 'docs', title: 'Official docs', url: 'https://example.org/docs?a=1&b=2' }] };

describe('reviewed tool articles', () => {
  it('escapes prose, headings and links without interpreting content as HTML', () => {
    const article = ToolArticleSchema.parse(record);
    const html = renderToolArticle(article) + renderToolParagraph(article, article.introduction);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('https://example.org/docs?a=1&amp;b=2');
    expect(html).toContain('Official docs</a>');
  });
  it('rejects missing citations, duplicate ids, unused sources and executable URLs', () => {
    expect(ToolArticleSchema.safeParse({ ...record, introduction: { text: 'Fact', sources: [] } }).success).toBe(false);
    expect(ToolArticleSchema.safeParse({ ...record, introduction: { text: 'Fact', sources: ['missing'] } }).success).toBe(false);
    expect(ToolArticleSchema.safeParse({ ...record, sources: [...record.sources, ...record.sources] }).success).toBe(false);
    expect(ToolArticleSchema.safeParse({ ...record, sources: [...record.sources, { ...record.sources[0], id: 'unused' }] }).success).toBe(false);
    expect(ToolArticleSchema.safeParse({ ...record, sources: [{ ...record.sources[0], url: 'javascript:alert(1)' }] }).success).toBe(false);
  });
  it('discovers a record without registration and rejects unknown tools and filenames', () => {
    const root = mkdtempSync(join(tmpdir(), 'tool-articles-'));
    try {
      expect(loadToolArticles(root, new Map()).size).toBe(0);
      mkdirSync(join(root, 'dataset/tool-articles'), { recursive: true });
      const file = join(root, 'dataset/tool-articles/cuda.json');
      writeFileSync(file, JSON.stringify(record));
      expect(loadToolArticles(root, new Map([['tool:cuda', {}]])).get('tool:cuda')?.sections).toHaveLength(3);
      expect(() => loadToolArticles(root, new Map())).toThrow('unknown tool');
      writeFileSync(file, JSON.stringify({ ...record, node_id: 'tool:other' }));
      expect(() => loadToolArticles(root, new Map([['tool:other', {}]]))).toThrow('filename');
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it('renders every real article into the existing canonical tool page', () => {
    const data = JSON.parse(readFileSync('dataset/v5/lineage_v5.json', 'utf8'));
    const nodes = new Map<string, unknown>(data.languages.map((n: { id: string }) => [n.id, n]));
    for (const [id, article] of loadToolArticles(process.cwd(), nodes)) {
      const html = readFileSync(`public/tools/${id.slice(5).replace(/_/g, '-')}/index.html`, 'utf8');
      expect(html).toContain(renderToolParagraph(article, article.introduction));
      for (const section of article.sections) expect(html).toContain(section.heading);
      for (const source of article.sources) expect(html).toContain(source.url.replace(/&/g, '&amp;'));
    }
  });
  it('keeps infrastructure out of written-in answers and FAQ structured data', () => {
    const html = readFileSync('public/tools/cuda/index.html', 'utf8');
    expect(html).not.toMatch(/written in (?:<strong>)?LLVM/);
    expect(html).not.toContain('primarily implemented in LLVM');
    expect(html).toContain('compiler is built on');
    expect(html).toContain('Built on</span>');
    const jax = readFileSync('public/tools/jax/index.html', 'utf8');
    expect(jax).not.toMatch(/written in (?:<strong>)?XLA/);
  });
});
