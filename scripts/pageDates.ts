/**
 * Stable per-URL modification dates.
 *
 * Every generated page carries a `lastmod` that must only advance when the page
 * content actually changes, not on every build. The manifest at
 * `scripts/page-dates.json` maps a URL path to the hash of its last-written
 * content plus the date that content first appeared.
 *
 * The hash is taken over the page HTML while it still contains the LASTMOD_TOKEN
 * placeholder, so the date never feeds into its own hash and the comparison is
 * stable across runs.
 *
 * The manifest lives under `scripts/`, not `dataset/`, because `public/dataset`
 * is a symlink to `dataset/` and anything there is served publicly.
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, sep } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const MANIFEST_PATH = join(ROOT, 'scripts', 'page-dates.json');

export const LASTMOD_TOKEN = '__LASTMOD__';

interface Entry {
  hash: string;
  lastmod: string;
}

/**
 * URLs that appear in the sitemap but are not written by generateSeoPages: the
 * SPA shell routes. They are seeded from git history and preserved when the
 * manifest is pruned, since no build pass will ever touch them.
 */
const PRESERVED_URLS = new Set(['/', '/explore']);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadManifest(): Record<string, Entry> {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    const parsed = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // A corrupt manifest must not break the build; it rebuilds from this run.
    return {};
  }
}

const manifest: Record<string, Entry> = loadManifest();
const touched = new Set<string>();

export function hashContent(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 16);
}

/**
 * Convert an absolute path under public/ to its canonical URL path.
 * `public/languages/occam/index.html` -> `/languages/occam`
 * `public/index.html`                 -> `/`
 */
export function filePathToUrl(filePath: string): string {
  let rel = filePath.startsWith(PUBLIC) ? filePath.slice(PUBLIC.length) : filePath;
  rel = rel.split(sep).join('/');
  if (!rel.startsWith('/')) rel = `/${rel}`;
  rel = rel.replace(/\/index\.html$/, '');
  rel = rel.replace(/\.html$/, '');
  return rel === '' ? '/' : rel;
}

/**
 * Resolve the lastmod for a page. `content` must still contain LASTMOD_TOKEN.
 * Returns the stored date when the content is unchanged, otherwise today.
 */
export function resolveDate(url: string, content: string): string {
  const hash = hashContent(content);
  touched.add(url);

  const existing = manifest[url];
  if (existing && existing.hash === hash) return existing.lastmod;

  const lastmod = today();
  manifest[url] = { hash, lastmod };
  return lastmod;
}

/**
 * Read-only lookup for consumers that do not write pages (the sitemap).
 * Falls back to the most recent known date so a missing entry can never emit an
 * empty or invalid <lastmod>.
 */
export function lookupDate(url: string): string {
  const entry = manifest[url];
  if (entry) return entry.lastmod;

  const known = Object.values(manifest).map((e) => e.lastmod).sort();
  return known.length > 0 ? known[known.length - 1] : today();
}

/**
 * Write the manifest back with sorted keys, dropping URLs that no longer
 * correspond to a generated page so it cannot grow unbounded.
 */
export function flushManifest(): void {
  const out: Record<string, Entry> = {};
  for (const url of Object.keys(manifest).sort()) {
    if (touched.has(url) || PRESERVED_URLS.has(url)) out[url] = manifest[url];
  }
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
  const pruned = Object.keys(manifest).length - Object.keys(out).length;
  console.log(
    `Page dates: ${Object.keys(out).length} URLs tracked` +
      (pruned > 0 ? `, ${pruned} stale entries pruned` : '')
  );
}

/** Seed or overwrite one entry. Used by the one-shot seeding script. */
export function setEntry(url: string, hash: string, lastmod: string): void {
  manifest[url] = { hash, lastmod };
  touched.add(url);
}

export function getManifest(): Readonly<Record<string, Entry>> {
  return manifest;
}
