/**
 * Network check for every dataset/ai/*.json file: fetches every source
 * and confirms each quoted sentence still appears in it (whitespace and curly quotes
 * normalized). Read-only, never edits the data. Not part of `npm run verify`,
 * because it depends on third-party sites; run it before publishing changes:
 *
 *   npm run check:ai-quotes
 */
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadAllPaths } from './aiPaths.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = loadAllPaths(ROOT);

const norm = (s: string) => s
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/[\s`]/g, '').toLowerCase();

function toText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

// GitHub file pages render client-side; fetch the raw file instead. Accept-Language is set
// because some doc sites (openxla.org) otherwise serve a random machine translation.
function fetchUrl(url: string): string {
  const m = url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/(.+)$/);
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}` : url;
}

// Keyed by URL so a source shared by several files is fetched once.
const quotes = new Map<string, Set<string>>();
for (const data of files) {
  for (const item of [...data.stages, ...data.steps]) {
    for (const e of item.evidence) {
      const url = data.sources[e.source].url;
      quotes.set(url, (quotes.get(url) ?? new Set()).add(e.quote));
    }
  }
}

let failures = 0;
for (const [id, set] of quotes) {
  const src = { url: id };
  let text = '';
  try {
    const res = await fetch(fetchUrl(src.url), { headers: { 'User-Agent': 'LanguageLineage quote check (+https://www.languagelineage.org)', 'Accept-Language': 'en' }, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = norm(toText(await res.text()));
  } catch (err) {
    console.log(`FETCH FAILED  ${id}  ${src.url}  (${(err as Error).message})`);
    failures += set.size;
    continue;
  }
  for (const q of set) {
    if (text.includes(norm(q))) console.log(`ok            ${id}  "${q.slice(0, 70)}${q.length > 70 ? '...' : ''}"`);
    else { console.log(`MISSING       ${id}  "${q}"`); failures++; }
  }
}
console.log(failures === 0 ? `\nAll quotes found (${[...quotes.values()].reduce((n, s) => n + s.size, 0)} distinct).` : `\n${failures} quote(s) not found. Check the source and update the data with a verified quote.`);
process.exit(failures === 0 ? 0 : 1);
