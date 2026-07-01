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
const staticFiles = ['robots.txt', 'sitemap.xml', 'manifest.json', 'og-image.svg', 'seo.css', 'llms.txt', 'favicon.svg', 'logo-mark.svg', 'logo-banner.svg'];
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
  if (urlCount < 100) warn(`sitemap.xml has only ${urlCount} URLs, expected ~140+`);
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

// Dataset page
const datasetPage = checkFile('dataset/index.html');
if (datasetPage) {
  if (!datasetPage.includes('<h1>')) fail('dataset/index.html missing h1');
  else ok('dataset/index.html has h1');
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
];
for (const slug of GUIDE_SLUGS) {
  checkFile(`guides/${slug}/index.html`);
}
if (GUIDE_SLUGS.length < 10) warn(`Only ${GUIDE_SLUGS.length} guides, expected 10+`);
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
  ['languages/python/index.html', 'CPython implementation explained'],
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

// Summary
console.log('');
console.log(`Validation complete: ${errors} errors, ${warnings} warnings`);
if (errors > 0) process.exit(1);
