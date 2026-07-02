import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SITE = 'https://www.languagelineage.org';

interface Language { id: string; name: string }
interface Relationship { relationship: string }
interface CatalogEntry { url: string; title: string; description: string }

const raw = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const languages: Language[] = raw.languages ?? [];
const rels: Relationship[] = raw.relationships ?? [];
const sitemap = readFileSync(join(PUBLIC, 'sitemap.xml'), 'utf8');

const langCount = languages.filter(l => l.id.startsWith('lang:')).length;
const toolCount = languages.filter(l => l.id.startsWith('tool:')).length;
const relTypeCounts: Record<string, number> = {};
rels.forEach(r => { relTypeCounts[r.relationship] = (relTypeCounts[r.relationship] || 0) + 1; });

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');
}

function clean(value: string): string {
  return decodeHtml(value).replace(/\s+/g, ' ').trim();
}

function markdownText(value: string): string {
  return value.replace(/([\[\]])/g, '\\$1');
}

function pageMetadata(url: string): CatalogEntry {
  const pathname = new URL(url).pathname;
  if (pathname === '/explore') {
    return {
      url,
      title: 'Interactive Graph Explorer',
      description: `Explore implementation, bootstrap, runtime, and influence relationships across ${languages.length} language and tool nodes.`,
    };
  }

  const filePath = pathname === '/'
    ? join(ROOT, 'index.html')
    : join(PUBLIC, pathname.replace(/^\//, ''), 'index.html');
  const html = readFileSync(filePath, 'utf8');
  const title = clean(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? pathname);
  const description = clean(html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] ?? 'Language Lineage reference page.');
  return { url, title, description };
}

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => clean(match[1]));
const catalog = urls.map(pageMetadata);
const catalogMarkdown = catalog
  .map(page => `- [${markdownText(page.title)}](${page.url}): ${page.description}`)
  .join('\n');

const shortContent = `# Language Lineage

> An open, evidence-backed dataset and interactive graph of what programming languages are written in, how compilers are bootstrapped, and how languages influenced each other.

The v5.0 dataset contains ${languages.length} nodes (${langCount} languages and ${toolCount} tools) and ${rels.length} sourced relationships. The dataset is available under CC BY 4.0 at ${SITE}/dataset.

## Indexable pages

${catalogMarkdown}
`;

const relationshipRows = Object.entries(relTypeCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => `| ${type} | ${count} |`)
  .join('\n');

const fullContent = `# Language Lineage — Full Site Reference

Language Lineage is a structured knowledge base for programming-language implementation and influence relationships. It answers questions such as what Python is written in, how Rust is bootstrapped, and which languages influenced JavaScript.

## Dataset

- Version: 5.0
- Total nodes: ${languages.length}
- Language nodes: ${langCount}
- Tool nodes: ${toolCount}
- Relationships: ${rels.length}
- Evidence coverage: every relationship has at least one source URL
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)
- Download: ${SITE}/dataset/v5/lineage_v5.json
- Artifact page: ${SITE}/dataset

## Relationship types

| Type | Count |
|---|---:|
${relationshipRows}

## Data schema

Language and tool nodes include identity, release year, implementation, paradigm, typing, runtime, self-hosting, cluster, enrichment, and logo metadata. Relationships include source and target identifiers, relationship type, date range, confidence, evidence URL, and notes.

## Citation

Language Lineage. Programming Language Lineage Dataset, v5.0. ${languages.length} nodes and ${rels.length} relationships. ${SITE}/dataset

## Complete indexable page catalog

${catalogMarkdown}
`;

writeFileSync(join(PUBLIC, 'llms.txt'), shortContent, 'utf8');
writeFileSync(join(PUBLIC, 'llms-full.txt'), fullContent, 'utf8');
console.log(`Generated llms.txt and llms-full.txt with ${catalog.length} indexable pages`);
