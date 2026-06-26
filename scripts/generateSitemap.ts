import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SITE = 'https://www.languagelineage.org';

function idToSlug(id: string): string {
  return id.replace(/^(lang|tool):/, '').replace(/_/g, '-');
}

function idToPrefix(id: string): string {
  return id.startsWith('tool:') ? 'tools' : 'languages';
}

interface Language { id: string }
interface Relationship { relationship: string }

const raw = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const languages: Language[] = raw.languages ?? [];
const rels: Relationship[] = raw.relationships ?? [];
const relTypes = [...new Set(rels.map((r) => r.relationship))];

const GUIDE_SLUGS = [
  'what-is-compiler-bootstrapping',
  'what-is-self-hosting',
  'compiler-vs-interpreter-vs-runtime',
  'programming-language-family-tree',
  'how-javascript-engines-work',
  'how-python-is-implemented',
  'how-rust-is-bootstrapped',
  'gcc-vs-llvm',
  'how-programming-languages-are-made',
  'v8-vs-spidermonkey-vs-javascriptcore',
];

const QUESTION_SLUGS = [
  'what-is-python-written-in',
  'what-is-javascript-written-in',
  'what-is-rust-written-in',
  'what-is-go-written-in',
  'what-is-java-written-in',
  'what-is-c-written-in',
  'what-is-cpp-written-in',
  'what-is-typescript-written-in',
  'what-is-ruby-written-in',
  'what-is-v8-written-in',
  'what-is-cpython-written-in',
  'what-is-compiler-bootstrapping',
  'what-is-a-self-hosting-compiler',
];

const urls: Array<{ loc: string; changefreq: string; priority: string }> = [
  { loc: `${SITE}/`, changefreq: 'monthly', priority: '1.0' },
  { loc: `${SITE}/explore`, changefreq: 'monthly', priority: '0.9' },
  // New keyword landing pages
  { loc: `${SITE}/programming-language-graph`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${SITE}/programming-language-family-tree`, changefreq: 'monthly', priority: '0.85' },
  { loc: `${SITE}/programming-language-evolution`, changefreq: 'monthly', priority: '0.85' },
  { loc: `${SITE}/what-are-programming-languages-written-in`, changefreq: 'monthly', priority: '0.85' },
  { loc: `${SITE}/programming-language-genealogy`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE}/compiler-runtime-bootstrap`, changefreq: 'monthly', priority: '0.8' },
  // Questions
  { loc: `${SITE}/questions`, changefreq: 'monthly', priority: '0.75' },
  ...QUESTION_SLUGS.map(s => ({ loc: `${SITE}/questions/${s}`, changefreq: 'monthly', priority: '0.8' })),
  // Core pages
  { loc: `${SITE}/dataset`, changefreq: 'monthly', priority: '0.8' },
  { loc: `${SITE}/languages`, changefreq: 'monthly', priority: '0.75' },
  { loc: `${SITE}/tools`, changefreq: 'monthly', priority: '0.75' },
  { loc: `${SITE}/guides`, changefreq: 'monthly', priority: '0.75' },
  { loc: `${SITE}/relationships`, changefreq: 'monthly', priority: '0.75' },
  { loc: `${SITE}/timeline`, changefreq: 'monthly', priority: '0.75' },
];

for (const lang of languages) {
  const prefix = idToPrefix(lang.id);
  const slug = idToSlug(lang.id);
  urls.push({ loc: `${SITE}/${prefix}/${slug}`, changefreq: 'monthly', priority: '0.7' });
}

for (const type of relTypes) {
  const slug = type.replace(/_/g, '-');
  urls.push({ loc: `${SITE}/relationships/${slug}`, changefreq: 'monthly', priority: '0.6' });
}

for (const slug of GUIDE_SLUGS) {
  urls.push({ loc: `${SITE}/guides/${slug}`, changefreq: 'monthly', priority: '0.65' });
}

const today = new Date().toISOString().split('T')[0];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

writeFileSync(join(PUBLIC, 'sitemap.xml'), xml, 'utf8');
console.log(`Generated sitemap.xml with ${urls.length} URLs`);
