import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SITE = 'https://www.languagelineage.org';

let errors = 0;
let warnings = 0;

function fail(msg: string) {
  console.error(`FAIL: ${msg}`);
  errors++;
}

function warn(msg: string) {
  console.warn(`WARN: ${msg}`);
  warnings++;
}

function ok(msg: string) {
  console.log(`OK:   ${msg}`);
}

function checkFile(rel: string): string | null {
  const p = join(PUBLIC, rel);
  if (!existsSync(p)) { fail(`Missing: public/${rel}`); return null; }
  return readFileSync(p, 'utf8');
}

// Static files
const staticFiles = ['robots.txt', 'sitemap.xml', 'manifest.json', 'og-image.svg', 'seo.css', 'llms.txt', 'llms-full.txt', 'favicon.svg', 'logo-mark.svg', 'logo-banner.svg'];
for (const f of staticFiles) {
  const content = checkFile(f);
  if (content) ok(`public/${f} exists (${content.length} bytes)`);
}

// robots.txt content
const robots = checkFile('robots.txt');
if (robots) {
  if (!robots.includes('Sitemap:')) fail('robots.txt missing Sitemap directive');
  else ok('robots.txt has Sitemap directive');
  if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail('robots.txt Sitemap does not use canonical www host');
  else ok('robots.txt Sitemap uses canonical www host');
}

// sitemap.xml
const sitemap = checkFile('sitemap.xml');
if (sitemap) {
  const urlCount = (sitemap.match(/<url>/g) || []).length;
  ok(`sitemap.xml has ${urlCount} URLs`);
  if (urlCount < 280) warn(`sitemap.xml has only ${urlCount} URLs, expected 280+ after Phase 3 auto question pages`);
  if (sitemap.includes('https://languagelineage.org')) fail('sitemap.xml contains non-www URLs');
  else ok('sitemap.xml uses canonical www host');
}

// manifest.json
const manifest = checkFile('manifest.json');
if (manifest) {
  try {
    const m = JSON.parse(manifest);
    if (!m.name) fail('manifest.json missing name');
    if (!m.icons || m.icons.length === 0) fail('manifest.json missing icons');
    else ok('manifest.json valid');
  } catch {
    fail('manifest.json is invalid JSON');
  }
}

// index.html
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8');
const indexChecks = [
  // canonical intentionally omitted from index.html, react-helmet-async sets it per route
  ['og:title', 'og:title'],
  ['og:description', 'og:description'],
  ['og:image', 'og:image'],
  ['twitter:card', 'twitter:card'],
  ['JSON-LD', 'application/ld+json'],
  ['manifest link', 'rel="manifest"'],
  ['theme-color', 'theme-color'],
];
for (const [label, needle] of indexChecks) {
  if (!indexHtml.includes(needle)) fail(`index.html missing ${label}`);
  else ok(`index.html has ${label}`);
}
if (indexHtml.includes('"@type": "Dataset"') || indexHtml.includes('"@type":"Dataset"')) {
  fail('index.html duplicates Dataset JSON-LD; Dataset schema belongs on /dataset only');
} else {
  ok('Dataset JSON-LD has a single source of truth on /dataset');
}

// Language/tool pages
interface LangNode { id: string; name: string }
const raw = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const languages: LangNode[] = raw.languages ?? [];

function idToSlug(id: string): string {
  return id.replace(/^(lang|tool):/, '').replace(/_/g, '-');
}
function idToPrefix(id: string): string {
  return id.startsWith('tool:') ? 'tools' : 'languages';
}

const titles = new Set<string>();
let pageErrors = 0;
let embedKitErrors = 0;

for (const lang of languages) {
  const prefix = idToPrefix(lang.id);
  const slug = idToSlug(lang.id);
  const relPath = `${prefix}/${slug}/index.html`;
  const content = checkFile(relPath);
  if (!content) { pageErrors++; continue; }

  // Check required elements
  if (!content.includes('<title>')) { fail(`${relPath}: missing <title>`); pageErrors++; }
  if (!content.includes('name="description"')) { fail(`${relPath}: missing meta description`); pageErrors++; }
  if (!content.includes('rel="canonical"')) { fail(`${relPath}: missing canonical`); pageErrors++; }
  if (!content.includes('application/ld+json')) { fail(`${relPath}: missing JSON-LD`); pageErrors++; }
  if (lang.id.startsWith('lang:')) {
    const expectedEmbed = `https://www.languagelineage.org/embed?lang=${idToSlug(lang.id)}`;
    if (!content.includes('class="embed-kit"') || !content.includes(expectedEmbed)) {
      fail(`${relPath}: missing portable embed kit`);
      embedKitErrors++;
    }
  }

  // Check description length
  const descMatch = content.match(/name="description" content="([^"]+)"/);
  if (descMatch) {
    const desc = descMatch[1];
    if (desc.length > 160) warn(`${relPath}: description too long (${desc.length} chars)`);
  }

  // Check duplicate titles
  const titleMatch = content.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    const title = titleMatch[1];
    if (titles.has(title)) fail(`${relPath}: duplicate title "${title}"`);
    else titles.add(title);
  }
}

if (pageErrors === 0) ok(`All ${languages.length} language/tool pages valid`);
if (embedKitErrors === 0) ok('All language pages have portable embed snippets');

// Dataset page
const datasetPage = checkFile('dataset/index.html');
if (datasetPage) {
  if (!datasetPage.includes('<h1>')) fail('dataset/index.html missing h1');
  else ok('dataset/index.html has h1');
  const requiredDatasetArtifacts = [
    'Current version:</strong> v5.0',
    'Download dataset JSON',
    'Creative Commons Attribution 4.0 International',
    'class="citation-block"',
    'class="embed-kit"',
    'https://www.languagelineage.org/embed?lang=rust',
  ];
  for (const artifact of requiredDatasetArtifacts) {
    if (!datasetPage.includes(artifact)) fail(`dataset/index.html missing Phase 13 artifact: ${artifact}`);
  }

  const jsonLdMatch = datasetPage.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  try {
    const schema = JSON.parse(jsonLdMatch?.[1] ?? '{}');
    if (schema['@type'] !== 'Dataset') fail('dataset/index.html JSON-LD is not Dataset');
    if (schema.version !== '5.0') fail('dataset/index.html JSON-LD missing version 5.0');
    if (schema.license !== 'https://creativecommons.org/licenses/by/4.0/') fail('dataset/index.html JSON-LD has unexpected license');
    if (schema.distribution?.contentUrl !== `${SITE}/dataset/v5/lineage_v5.json`) fail('dataset/index.html JSON-LD missing direct DataDownload URL');
    else ok('dataset/index.html Dataset JSON-LD has version, license, and download metadata');
  } catch {
    fail('dataset/index.html Dataset JSON-LD is invalid JSON');
  }
}

// Phase 13: llms.txt must cover the complete indexable sitemap.
if (sitemap) {
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  for (const file of ['llms.txt', 'llms-full.txt']) {
    const llms = checkFile(file);
    if (!llms) continue;
    const missing = sitemapUrls.filter(url => !llms.includes(`](${url})`));
    if (missing.length > 0) fail(`${file} is missing ${missing.length} sitemap URLs; first missing: ${missing[0]}`);
    else ok(`${file} lists all ${sitemapUrls.length} indexable pages`);
  }
}

// Relationship pages
const relTypes = [...new Set((raw.relationships as any[]).map(r => r.relationship as string))];
for (const type of relTypes) {
  const slug = type.replace(/_/g, '-');
  checkFile(`relationships/${slug}/index.html`);
}
ok(`${relTypes.length} relationship pages checked`);

// Guide pages
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
for (const slug of GUIDE_SLUGS) {
  checkFile(`guides/${slug}/index.html`);
}
if (GUIDE_SLUGS.length < 13) warn(`Only ${GUIDE_SLUGS.length} guides, expected 13+`);
else ok(`${GUIDE_SLUGS.length} guide pages checked`);

// Collection index pages
const indexPages = ['languages/index.html', 'tools/index.html', 'guides/index.html', 'relationships/index.html'];
for (const p of indexPages) {
  const content = checkFile(p);
  if (content && !content.includes('<h1>')) fail(`${p}: missing h1`);
}
ok(`${indexPages.length} collection index pages checked`);

// Priority title spot-checks
const prioritySpotChecks: Array<[string, string]> = [
  ['languages/python/index.html', 'CPython: written in C'],
  ['languages/rust/index.html', 'rustc bootstrapping explained'],
  ['languages/javascript/index.html', 'V8, SpiderMonkey, and JSC'],
];
for (const [path, expectedSnippet] of prioritySpotChecks) {
  const content = checkFile(path);
  if (content && !content.includes(expectedSnippet)) fail(`${path}: missing custom title snippet "${expectedSnippet}"`);
  else if (content) ok(`${path}: custom title present`);
}

// New landing pages
const NEW_LANDING_PAGES = [
  'programming-language-graph/index.html',
  'programming-language-family-tree/index.html',
  'programming-language-genealogy/index.html',
  'programming-language-evolution/index.html',
  'what-are-programming-languages-written-in/index.html',
  'compiler-runtime-bootstrap/index.html',
  'directory/index.html',
  'how-it-works/index.html',
];
let landingErrors = 0;
for (const p of NEW_LANDING_PAGES) {
  const content = checkFile(p);
  if (!content) { landingErrors++; continue; }
  if (!content.includes('<h1>')) { fail(`${p}: missing h1`); landingErrors++; }
  if (!content.includes('rel="canonical"')) { fail(`${p}: missing canonical`); landingErrors++; }
  if (!content.includes('application/ld+json')) { fail(`${p}: missing JSON-LD`); landingErrors++; }
}
if (landingErrors === 0) ok(`${NEW_LANDING_PAGES.length} new landing pages valid`);

// Question pages
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
const questionsIndex = checkFile('questions/index.html');
if (questionsIndex && !questionsIndex.includes('<h1>')) fail('questions/index.html missing h1');
else if (questionsIndex) ok('questions/index.html valid');

let questionErrors = 0;
for (const slug of QUESTION_SLUGS) {
  const content = checkFile(`questions/${slug}/index.html`);
  if (!content) { questionErrors++; continue; }
  if (!content.includes('<h1>')) { fail(`questions/${slug}: missing h1`); questionErrors++; }
  if (!content.includes('question-answer')) { fail(`questions/${slug}: missing answer box`); questionErrors++; }
}
if (questionErrors === 0) ok(`${QUESTION_SLUGS.length} question pages valid`);

// Phase 3: auto-generated question pages spot-check
// Compute qualifying nodes using same criteria as generateSeoPages.ts
interface SitemapRel { relationship: string; to_language: string }
const sitemapRaw2 = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/lineage_v5.json'), 'utf8'));
const sitemapEnrich = JSON.parse(readFileSync(join(ROOT, 'dataset/v5/enrichment_v5.json'), 'utf8')).enrichment ?? {};
const IMPL_REL_TYPES_V = new Set(['compiler_written_in', 'runtime_written_in', 'bootstrap_written_in']);
const HAND_AUTHORED_V = new Set(['python','javascript','rust','go','java','c','cxx','typescript','ruby']);
const implRelsV: SitemapRel[] = (sitemapRaw2.relationships ?? []).filter((r: SitemapRel) => IMPL_REL_TYPES_V.has(r.relationship));
const incomingImplV = new Set(implRelsV.filter((r: SitemapRel) => r.to_language.startsWith('lang:')).map((r: SitemapRel) => r.to_language));
const autoSlugsV: string[] = [];
for (const node of (sitemapRaw2.languages ?? []) as Array<{id: string}>) {
  if (!node.id.startsWith('lang:')) continue;
  const slug = node.id.replace(/^lang:/, '').replace(/_/g, '-');
  if (HAND_AUTHORED_V.has(slug)) continue;
  if (!incomingImplV.has(node.id)) continue;
  if (!sitemapEnrich[node.id]) continue;
  autoSlugsV.push(slug);
}
const SPOT_CHECK_AUTO = autoSlugsV.slice(0, 5);
let autoErrors = 0;
for (const slug of SPOT_CHECK_AUTO) {
  const path = `questions/what-is-${slug}-written-in/index.html`;
  const content = checkFile(path);
  if (!content) { autoErrors++; continue; }
  if (!content.includes('<h1>')) { fail(`${path}: missing h1`); autoErrors++; }
  if (!content.includes('question-answer')) { fail(`${path}: missing answer box`); autoErrors++; }
  if (!content.includes('impl-table')) { fail(`${path}: missing implementation table`); autoErrors++; }
  if (!content.includes('application/ld+json')) { fail(`${path}: missing JSON-LD`); autoErrors++; }
}
if (autoErrors === 0) ok(`${autoSlugsV.length} auto question pages generated; spot-checked ${SPOT_CHECK_AUTO.length}`);

// Check Discover More section on priority language pages
const discoverMoreChecks = ['languages/python/index.html', 'languages/rust/index.html', 'languages/javascript/index.html'];
for (const p of discoverMoreChecks) {
  const content = checkFile(p);
  if (content && !content.includes('discover-more')) fail(`${p}: missing Discover More section`);
  else if (content) ok(`${p}: has Discover More section`);
}

// Phase 5: dateModified in JSON-LD on language pages
const dateModifiedChecks = ['languages/python/index.html', 'languages/rust/index.html', 'languages/javascript/index.html', 'languages/go/index.html', 'languages/java/index.html'];
let dateErrors = 0;
for (const p of dateModifiedChecks) {
  const content = checkFile(p);
  if (content && !content.includes('dateModified')) { fail(`${p}: missing dateModified in JSON-LD`); dateErrors++; }
  if (content && !content.includes('datePublished')) { fail(`${p}: missing datePublished in JSON-LD`); dateErrors++; }
}
if (dateErrors === 0) ok(`${dateModifiedChecks.length} priority pages have date fields in JSON-LD`);

// Phase 5: robots meta tag in SPA shell
if (!indexHtml.includes('name="robots"')) fail('index.html missing robots meta tag');
else ok('index.html has robots meta tag');

// Phase 5: OG article timestamps on priority pages
let ogDateErrors = 0;
for (const p of dateModifiedChecks) {
  const content = checkFile(p);
  if (content && !content.includes('article:published_time')) { fail(`${p}: missing article:published_time OG tag`); ogDateErrors++; }
  if (content && !content.includes('article:modified_time')) { fail(`${p}: missing article:modified_time OG tag`); ogDateErrors++; }
}
if (ogDateErrors === 0) ok(`${dateModifiedChecks.length} priority pages have OG article timestamps`);

// Phase 5: speakable on question pages
const speakableChecks = ['questions/what-is-rust-written-in/index.html', 'questions/what-is-python-written-in/index.html'];
let speakableErrors = 0;
for (const p of speakableChecks) {
  const content = checkFile(p);
  if (content && !content.includes('SpeakableSpecification')) { fail(`${p}: missing speakable JSON-LD`); speakableErrors++; }
}
if (speakableErrors === 0) ok(`${speakableChecks.length} question pages have speakable JSON-LD`);

// Phase 5: vercel.json redirect
const vercelJson = readFileSync(join(ROOT, 'vercel.json'), 'utf8');
try {
  const vercel = JSON.parse(vercelJson);
  if (!vercel.redirects || vercel.redirects.length === 0) fail('vercel.json missing redirect rules');
  else ok('vercel.json has redirect rules');
} catch {
  fail('vercel.json is invalid JSON');
}

// Phase 2: Title and description uniqueness + length sweep across all generated pages.
// Covers every index.html under public/ except the SPA shell.
import { readdirSync, statSync } from 'fs';

function walkHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...walkHtmlFiles(full));
    else if (entry === 'index.html') results.push(full);
  }
  return results;
}

const allHtmlFiles = walkHtmlFiles(PUBLIC);
const titleMap = new Map<string, string[]>(); // title -> [file, ...]
const descMap = new Map<string, string[]>();
const titlePrefixMap = new Map<string, string[]>(); // self-canonical pages only
const TITLE_MAX = 75;
const DESC_MIN = 75;
const DESC_MAX = 180;
let titleLengthErrors = 0;
let descLengthErrors = 0;
let missingAnalytics = 0;

for (const filePath of allHtmlFiles) {
  const rel = filePath.replace(PUBLIC + '/', '');
  const html = readFileSync(filePath, 'utf8');

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/);

  if (titleMatch) {
    const t = titleMatch[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    if (!titleMap.has(t)) titleMap.set(t, []);
    titleMap.get(t)!.push(rel);
    // A page that canonicalizes elsewhere is a deliberate duplicate, so only
    // compare title prefixes between pages that are their own canonical.
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    const selfUrl = `${SITE}/${rel.replace(/\/?index\.html$/, '')}`.replace(/\/$/, '');
    if (!canonical || canonical.replace(/\/$/, '') === selfUrl) {
      const prefix = t.split(' | ')[0].trim().toLowerCase();
      if (!titlePrefixMap.has(prefix)) titlePrefixMap.set(prefix, []);
      titlePrefixMap.get(prefix)!.push(rel);
    }
    if (t.length > TITLE_MAX) { fail(`${rel}: title too long (${t.length} chars, max ${TITLE_MAX}): "${t.slice(0, 60)}..."`); titleLengthErrors++; }
  } else {
    fail(`${rel}: missing <title>`);
  }

  if (descMatch) {
    const d = descMatch[1].replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    if (!descMap.has(d)) descMap.set(d, []);
    descMap.get(d)!.push(rel);
    if (d.length < DESC_MIN) { warn(`${rel}: description too short (${d.length} chars, min ${DESC_MIN})`); descLengthErrors++; }
    if (d.length > DESC_MAX) { warn(`${rel}: description too long (${d.length} chars, max ${DESC_MAX})`); descLengthErrors++; }
  } else {
    fail(`${rel}: missing meta description`);
  }

  // Vercel Analytics beacon must be present on every generated page
  if (!html.includes('_vercel/insights')) {
    fail(`${rel}: missing Vercel Analytics beacon`);
    missingAnalytics++;
  }

  // Heading hierarchy: exactly one h1, no skipped levels
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count === 0) fail(`${rel}: missing <h1>`);
  if (h1Count > 1) fail(`${rel}: multiple <h1> tags (${h1Count})`);
  const headingLevels = [...html.matchAll(/<h([1-6])[\s>]/gi)].map(m => parseInt(m[1]));
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) {
      fail(`${rel}: heading level skips from h${headingLevels[i-1]} to h${headingLevels[i]}`);
      break;
    }
  }
}

const dupTitles = [...titleMap.entries()].filter(([, files]) => files.length > 1);
const dupDescs = [...descMap.entries()].filter(([, files]) => files.length > 1);

if (dupTitles.length === 0) {
  ok(`All ${allHtmlFiles.length} pages have unique titles`);
} else {
  for (const [t, files] of dupTitles) {
    fail(`Duplicate title "${t.slice(0, 60)}" on: ${files.slice(0, 3).join(', ')}`);
  }
}

if (dupDescs.length === 0) {
  ok(`All ${allHtmlFiles.length} pages have unique descriptions`);
} else {
  for (const [d, files] of dupDescs) {
    fail(`Duplicate description "${d.slice(0, 60)}" on: ${files.slice(0, 3).join(', ')}`);
  }
}

const dupPrefixes = [...titlePrefixMap.entries()].filter(([, files]) => files.length > 1);
if (dupPrefixes.length === 0) {
  ok(`No two self-canonical pages share a title prefix`);
} else {
  for (const [pfx, files] of dupPrefixes) {
    fail(`Duplicate title prefix "${pfx.slice(0, 50)}" on: ${files.slice(0, 3).join(', ')}`);
  }
}

if (missingAnalytics === 0) ok(`All ${allHtmlFiles.length} pages have the Vercel Analytics beacon`);
if (titleLengthErrors === 0) ok(`All titles within ${TITLE_MAX} chars`);
if (descLengthErrors === 0) ok(`All descriptions within ${DESC_MIN}-${DESC_MAX} chars`);

// OG images check
const OG_DIR = join(PUBLIC, 'og');
if (existsSync(OG_DIR)) {
  const { readdirSync, statSync } = await import('fs');
  const ogFiles = readdirSync(OG_DIR).filter(f => f.endsWith('.png'));
  let totalBytes = 0;
  let oversized = 0;
  for (const f of ogFiles) {
    const sz = statSync(join(OG_DIR, f)).size;
    totalBytes += sz;
    if (sz > 120 * 1024) oversized++;
  }
  const mb = (totalBytes / 1024 / 1024).toFixed(1);
  if (oversized > 0) warn(`${oversized} OG images exceed 120 kB`);
  if (totalBytes > 20 * 1024 * 1024) warn(`OG image total (${mb} MB) exceeds 20 MB`);
  ok(`${ogFiles.length} OG images (${mb} MB)`);
} else {
  warn('public/og/ directory missing; run npm run og:generate');
}

// Summary
console.log('');
console.log(`Validation complete: ${errors} errors, ${warnings} warnings`);
if (errors > 0) process.exit(1);
