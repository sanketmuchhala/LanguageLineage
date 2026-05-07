import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

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
const staticFiles = ['robots.txt', 'sitemap.xml', 'manifest.json', 'og-image.svg', 'seo.css', 'llms.txt', 'favicon.svg'];
for (const f of staticFiles) {
  const content = checkFile(f);
  if (content) ok(`public/${f} exists (${content.length} bytes)`);
}

// robots.txt content
const robots = checkFile('robots.txt');
if (robots) {
  if (!robots.includes('Sitemap:')) fail('robots.txt missing Sitemap directive');
  else ok('robots.txt has Sitemap directive');
}

// sitemap.xml
const sitemap = checkFile('sitemap.xml');
if (sitemap) {
  const urlCount = (sitemap.match(/<url>/g) || []).length;
  ok(`sitemap.xml has ${urlCount} URLs`);
  if (urlCount < 100) warn(`sitemap.xml has only ${urlCount} URLs — expected ~140+`);
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
  ['canonical', '<link rel="canonical"'],
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
const raw = JSON.parse(readFileSync(join(ROOT, 'dataset/v4/lineage_v4.json'), 'utf8'));
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
];
for (const slug of GUIDE_SLUGS) {
  checkFile(`guides/${slug}/index.html`);
}
ok(`${GUIDE_SLUGS.length} guide pages checked`);

// Summary
console.log('');
console.log(`Validation complete: ${errors} errors, ${warnings} warnings`);
if (errors > 0) process.exit(1);
