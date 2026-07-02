import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');

function walkHtmlFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...walkHtmlFiles(full));
    else if (entry === 'index.html') results.push(full);
  }
  return results;
}

function pathToUrl(filePath: string): string {
  const rel = filePath.replace(PUBLIC, '').replace(/\/index\.html$/, '');
  return rel || '/';
}

// Extract internal href links from HTML, skipping nav/footer boilerplate
function extractLinks(html: string): string[] {
  const links = new Set<string>();
  const hrefRe = /href="(\/[^"#?]*?)"/g;
  let m;
  while ((m = hrefRe.exec(html)) !== null) {
    const href = m[1];
    // Skip static assets
    if (/\.(css|js|svg|png|jpg|ico|txt|xml|json|woff2?)$/.test(href)) continue;
    // Normalize trailing slash
    const normalized = href === '/' ? '/' : href.replace(/\/$/, '');
    links.add(normalized);
  }
  return [...links];
}

const allFiles = walkHtmlFiles(PUBLIC);
const urlToFile = new Map<string, string>();
for (const f of allFiles) {
  urlToFile.set(pathToUrl(f), f);
}

// SPA routes that exist but have no index.html in public/
const KNOWN_SPA = new Set(['/', '/explore', '/embed']);
const allKnown = new Set([...urlToFile.keys(), ...KNOWN_SPA]);

// Build inbound/outbound link graphs
const outLinks = new Map<string, string[]>();
const inLinks = new Map<string, Set<string>>();
for (const url of allKnown) { outLinks.set(url, []); inLinks.set(url, new Set()); }

for (const [url, filePath] of urlToFile) {
  const html = readFileSync(filePath, 'utf8');
  const links = extractLinks(html);
  outLinks.set(url, links);
  for (const link of links) {
    if (!inLinks.has(link)) inLinks.set(link, new Set());
    inLinks.get(link)!.add(url);
  }
}

// BFS from / to measure crawl depth
function bfsDepth(start: string, maxDepth: number): Map<string, number> {
  const depth = new Map<string, number>();
  const queue: Array<[string, number]> = [[start, 0]];
  depth.set(start, 0);
  while (queue.length > 0) {
    const [url, d] = queue.shift()!;
    if (d >= maxDepth) continue;
    for (const link of outLinks.get(url) ?? []) {
      if (!depth.has(link) && allKnown.has(link)) {
        depth.set(link, d + 1);
        queue.push([link, d + 1]);
      }
    }
  }
  return depth;
}

// The SPA at / renders navigation links dynamically. Seed the BFS with
// those known targets so depth counts work correctly for the hybrid site.
const SPA_NAV_LINKS = ['/relationships', '/languages', '/tools', '/guides', '/timeline', '/dataset', '/questions', '/explore'];
for (const link of SPA_NAV_LINKS) {
  if (!outLinks.has('/')) outLinks.set('/', []);
  outLinks.get('/')!.push(link);
}

const MAX_DEPTH = 3;
const depths = bfsDepth('/', MAX_DEPTH);

// Broken links: href points to a URL that has no page (not in urlToFile or KNOWN_SPA)
const broken: Array<{ from: string; to: string }> = [];
for (const [url, links] of outLinks) {
  for (const link of links) {
    if (!allKnown.has(link)) {
      broken.push({ from: url, to: link });
    }
  }
}

// Over-depth: pages in urlToFile that are not reachable within MAX_DEPTH clicks from /
const overDepth = [...urlToFile.keys()].filter(url => !depths.has(url));

// Orphans: pages with fewer than 2 inbound links
const orphans: Array<{ url: string; count: number }> = [];
for (const [url] of urlToFile) {
  if (url === '/') continue;
  const count = inLinks.get(url)?.size ?? 0;
  if (count < 2) orphans.push({ url, count });
}
orphans.sort((a, b) => a.count - b.count || a.url.localeCompare(b.url));

// Report
console.log('# Internal Link Audit\n');
console.log(`Total pages in public/: ${urlToFile.size}`);
console.log(`Reachable within ${MAX_DEPTH} clicks from /: ${depths.size}`);
console.log(`Broken links: ${broken.length}`);
console.log(`Over-depth pages (unreachable within 3 clicks): ${overDepth.length}`);
console.log(`Orphans (< 2 inbound links): ${orphans.length}`);
console.log('');

if (broken.length > 0) {
  console.log('## Broken links');
  for (const b of broken.slice(0, 40)) console.log(`  ${b.from} -> ${b.to}`);
  if (broken.length > 40) console.log(`  ... and ${broken.length - 40} more`);
  console.log('');
}

if (overDepth.length > 0) {
  console.log('## Over-depth pages (> 3 clicks from /)');
  for (const u of overDepth.slice(0, 40)) console.log(`  ${u} (depth: unreachable)`);
  if (overDepth.length > 40) console.log(`  ... and ${overDepth.length - 40} more`);
  console.log('');
}

if (orphans.length > 0) {
  console.log('## Orphan pages (< 2 inbound links)');
  for (const o of orphans.slice(0, 40)) console.log(`  ${o.url} (${o.count} inbound)`);
  if (orphans.length > 40) console.log(`  ... and ${orphans.length - 40} more`);
  console.log('');
}

const hasIssues = broken.length > 0 || overDepth.length > 0 || orphans.length > 0;
console.log(`Audit ${hasIssues ? 'FAILED' : 'PASSED'}: ${broken.length} broken, ${overDepth.length} over-depth, ${orphans.length} orphans`);
if (hasIssues) process.exit(1);
