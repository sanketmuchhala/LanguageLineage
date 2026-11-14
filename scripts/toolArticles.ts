import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';

const Text = z.string().trim().min(1);
const CitedText = z.object({ text: Text, sources: z.array(Text).min(1) }).strict();
export const ToolArticleSchema = z.object({
  node_id: z.string().regex(/^tool:[a-z0-9_]+$/),
  introduction: CitedText,
  sections: z.array(z.object({ heading: Text, paragraphs: z.array(CitedText).min(1) }).strict()).min(3),
  sources: z.array(z.object({ id: z.string().regex(/^[a-z0-9_-]+$/), title: Text,
    url: z.string().url().refine(s => s.startsWith('https://'), 'Sources must use HTTPS'),
  }).strict()).min(1),
}).strict().superRefine((article, ctx) => {
  const ids = new Set(article.sources.map(s => s.id));
  if (ids.size !== article.sources.length) ctx.addIssue({ code: 'custom', message: 'Duplicate source id' });
  const used = new Set<string>();
  for (const p of [article.introduction, ...article.sections.flatMap(s => s.paragraphs)]) {
    for (const id of p.sources) {
      used.add(id);
      if (!ids.has(id)) ctx.addIssue({ code: 'custom', message: `Unknown citation: ${id}` });
    }
  }
  for (const id of ids) if (!used.has(id)) ctx.addIssue({ code: 'custom', message: `Unused source: ${id}` });
  if (new Set(article.sections.map(s => s.heading)).size !== article.sections.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate section heading' });
});
export type ToolArticle = z.infer<typeof ToolArticleSchema>;

export function loadToolArticles(root: string, nodes: ReadonlyMap<string, unknown>): Map<string, ToolArticle> {
  const dir = join(root, 'dataset/tool-articles');
  const articles = new Map<string, ToolArticle>();
  if (!existsSync(dir)) return articles;
  for (const file of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
    const article = ToolArticleSchema.parse(JSON.parse(readFileSync(join(dir, file), 'utf8')));
    if (!nodes.has(article.node_id)) throw new Error(`${file}: unknown tool ${article.node_id}`);
    if (file !== `${article.node_id.slice(5)}.json`) throw new Error(`${file}: filename must match node_id`);
    if (articles.has(article.node_id)) throw new Error(`Duplicate article: ${article.node_id}`);
    articles.set(article.node_id, article);
  }
  return articles;
}

const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]!));
export function renderToolParagraph(article: ToolArticle, paragraph: ToolArticle['introduction']): string {
  const citations = paragraph.sources.map(id => {
    const source = article.sources.find(s => s.id === id)!;
    return `<a href="${escape(source.url)}" rel="noopener noreferrer">${escape(source.title)}</a>`;
  }).join('; ');
  return `<p>${escape(paragraph.text)} <span class="src-type">[${citations}]</span></p>`;
}
export function renderToolArticle(article: ToolArticle): string {
  return article.sections.map(section => `<section class="intent-section"><h2>${escape(section.heading)}</h2>\n${section.paragraphs.map(p => renderToolParagraph(article, p)).join('\n')}</section>`).join('\n');
}
