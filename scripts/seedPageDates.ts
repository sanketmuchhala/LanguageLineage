/**
 * One-shot seeding for scripts/page-dates.json.
 *
 * Run once, after a normal `npm run seo:generate` has populated the manifest
 * with correct content hashes. This rewrites each entry's `lastmod` to a date
 * derived from git history for whatever input actually determines that page,
 * leaving the hashes untouched so the next build treats every page as unchanged.
 *
 *   npm run seo:generate     # populate hashes
 *   npm run seo:seed-dates   # backdate them from git
 *   npm run seo:generate     # must now be a no-op
 *
 * Kept in-tree so the manifest can be reseeded if it is ever lost.
 */

import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'scripts', 'page-dates.json');
const DATASET_REL = 'dataset/v5/lineage_v5.json';
const GENERATOR_REL = 'scripts/generateSeoPages.ts';

interface Entry { hash: string; lastmod: string }

function git(args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

/** Date of the last commit whose diff added or removed `needle` in `file`. */
function pickaxeDate(needle: string, file: string): string {
  return git(['log', '-1', '--format=%cs', `-S${needle}`, '--', file]).split('\n')[0] ?? '';
}

function fileDate(file: string): string {
  return git(['log', '-1', '--format=%cs', '--', file]);
}

const raw = JSON.parse(readFileSync(join(ROOT, DATASET_REL), 'utf8'));
const languages: Array<{ id: string }> = raw.languages ?? [];

// slug -> node id, mirroring idToSlug() in the generators.
const slugToId = new Map<string, string>();
for (const node of languages) {
  slugToId.set(node.id.replace(/^(lang|tool):/, '').replace(/_/g, '-'), node.id);
}

const GENERATOR_DATE = fileDate(GENERATOR_REL);
const nodeDateCache = new Map<string, string>();

function nodeDate(slug: string): string {
  const id = slugToId.get(slug);
  if (!id) return '';
  const cached = nodeDateCache.get(id);
  if (cached !== undefined) return cached;
  const date = pickaxeDate(`"${id}"`, DATASET_REL);
  nodeDateCache.set(id, date);
  return date;
}

/** The input responsible for a URL's content, resolved to a commit date. */
function deriveDate(url: string): string {
  let m: RegExpMatchArray | null;

  if (url === '/') return fileDate('index.html') || GENERATOR_DATE;
  if (url === '/explore') return fileDate('src/app/GraphExplorer.tsx') || GENERATOR_DATE;

  if ((m = url.match(/^\/(?:languages|tools)\/(.+)$/))) {
    return nodeDate(m[1]) || GENERATOR_DATE;
  }
  if ((m = url.match(/^\/questions\/what-is-(.+)-written-in$/))) {
    return nodeDate(m[1]) || pickaxeDate(url.slice(11), GENERATOR_REL) || GENERATOR_DATE;
  }
  if ((m = url.match(/^\/relationships\/(.+)$/))) {
    return pickaxeDate(m[1].replace(/-/g, '_'), DATASET_REL) || GENERATOR_DATE;
  }
  if ((m = url.match(/^\/(?:guides|questions)\/(.+)$/))) {
    return pickaxeDate(m[1], GENERATOR_REL) || GENERATOR_DATE;
  }

  // Index and landing pages: their content lives in the generator source.
  const segment = url.replace(/^\//, '');
  return pickaxeDate(segment, GENERATOR_REL) || GENERATOR_DATE;
}

const manifest: Record<string, Entry> = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

// The SPA shell routes appear in the sitemap but are never written by
// generateSeoPages, so nothing else will ever create their entries.
for (const url of ['/', '/explore']) {
  if (!manifest[url]) manifest[url] = { hash: '', lastmod: '' };
}

const out: Record<string, Entry> = {};
let changed = 0;

for (const url of Object.keys(manifest).sort()) {
  const derived = deriveDate(url);
  const lastmod = /^\d{4}-\d{2}-\d{2}$/.test(derived) ? derived : manifest[url].lastmod;
  if (lastmod !== manifest[url].lastmod) changed++;
  out[url] = { hash: manifest[url].hash, lastmod };
}

writeFileSync(MANIFEST_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

const distinct = [...new Set(Object.values(out).map((e) => e.lastmod))].sort();
console.log(`Seeded ${Object.keys(out).length} URLs (${changed} re-dated).`);
console.log(`${distinct.length} distinct dates: ${distinct.join(', ')}`);
