import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { lookupDate } from './pageDates.js';

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
interface FullLanguage { id: string; name: string }
interface Relationship { relationship: string; to_language: string; from_language: string }

const raw = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const languages: FullLanguage[] = raw.languages ?? [];
const rels: Relationship[] = raw.relationships ?? [];
const relTypes = [...new Set(rels.map((r) => r.relationship))];

// Auto-question-page qualifying nodes (same criteria as generateSeoPages.ts)
const enrichmentRaw = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/enrichment_v5.json'), 'utf8'));
const enrichmentMap: Record<string, unknown> = enrichmentRaw.enrichment ?? {};
const IMPL_REL_TYPES_Q = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in']);
const HAND_AUTHORED_Q = new Set(['python','javascript','rust','go','java','c','cxx','typescript','ruby']);
const incomingImplIds = new Set<string>();
for (const rel of rels) {
  if (!IMPL_REL_TYPES_Q.has(rel.relationship)) continue;
  if (!rel.to_language.startsWith('lang:')) continue;
  incomingImplIds.add(rel.to_language);
}
const AUTO_QUESTION_SLUGS: string[] = [];
for (const node of languages) {
  if (!node.id.startsWith('lang:')) continue;
  const slug = idToSlug(node.id);
  if (HAND_AUTHORED_Q.has(slug)) continue;
  if (!incomingImplIds.has(node.id)) continue;
  if (!enrichmentMap[node.id]) continue;
  AUTO_QUESTION_SLUGS.push(slug);
}

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
  'typescript-vs-javascript-implementation',
  'graalvm-vs-hotspot',
  'the-c-bootstrap-chain',
];

// Question pages that canonicalize to their language page (see
// QUESTION_CANONICAL_TO_LANG in generateSeoPages.ts) are non-canonical, so they
// stay out of the sitemap.
const QUESTION_CANONICAL_TO_LANG = new Set(['rust', 'python', 'roc', 'prolog']);

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
  'is-javascript-written-in-c',
  'is-rustc-written-in-rust',
  'is-rust-compiled',
];

const urls: Array<{ loc: string }> = [
  { loc: `${SITE}/` },
  { loc: `${SITE}/explore` },
  // New keyword landing pages
  { loc: `${SITE}/rankings/most-influential` },
  { loc: `${SITE}/embed-kit` },
  { loc: `${SITE}/programming-language-graph` },
  { loc: `${SITE}/programming-language-evolution` },
  { loc: `${SITE}/what-are-programming-languages-written-in` },
  { loc: `${SITE}/programming-language-genealogy` },
  { loc: `${SITE}/compiler-runtime-bootstrap` },
  // Questions
  { loc: `${SITE}/questions` },
  ...QUESTION_SLUGS.filter(s => !QUESTION_CANONICAL_TO_LANG.has((s.match(/^what-is-(.+)-written-in$/) || [])[1] || '')).map(s => ({ loc: `${SITE}/questions/${s}` })),
  ...AUTO_QUESTION_SLUGS.filter(s => !QUESTION_CANONICAL_TO_LANG.has(s)).map(s => ({ loc: `${SITE}/questions/what-is-${s}-written-in` })),
  // Core pages
  { loc: `${SITE}/directory` },
  { loc: `${SITE}/how-it-works` },
  { loc: `${SITE}/dataset` },
  { loc: `${SITE}/languages` },
  { loc: `${SITE}/tools` },
  { loc: `${SITE}/guides` },
  { loc: `${SITE}/relationships` },
  { loc: `${SITE}/timeline` },
];

for (const lang of languages) {
  const prefix = idToPrefix(lang.id);
  const slug = idToSlug(lang.id);
  urls.push({ loc: `${SITE}/${prefix}/${slug}` });
}

for (const type of relTypes) {
  const slug = type.replace(/_/g, '-');
  urls.push({ loc: `${SITE}/relationships/${slug}` });
}

for (const slug of GUIDE_SLUGS) {
  urls.push({ loc: `${SITE}/guides/${slug}` });
}

function pathOf(loc: string): string {
  const path = loc.slice(SITE.length);
  return path === '' ? '/' : path;
}
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${lookupDate(pathOf(u.loc))}</lastmod>
  </url>`).join('\n')}
</urlset>`;

writeFileSync(join(PUBLIC, 'sitemap.xml'), xml, 'utf8');
console.log(`Generated sitemap.xml with ${urls.length} URLs`);
