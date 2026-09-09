/**
 * Stage 2.2 of IMPLEMENTATION_PLAN.md: "RSS feed generated in the existing
 * SEO build chain." The plan's own reasoning: an HN or Reddit front page
 * sends 10-25k people and there is currently nothing to catch them.
 *
 * Scoped to the site's "story" content - the 13 guides and the rankings
 * page - not all 305 URLs. A feed of 152 language reference pages and 117
 * auto-generated question pages is not what an RSS reader wants; guides and
 * the flagship story are the closest thing this site has to posts.
 *
 * Modeled on generateLlmsTxt.ts: reads title/description straight out of the
 * already-written HTML rather than keeping a second, hand-maintained copy of
 * that text that could drift from what generateSeoPages.ts actually rendered.
 * pubDate comes from the same per-page manifest the sitemap's lastmod uses
 * (scripts/pageDates.ts), so an item's date and its lastmod can never
 * disagree - one date per page, one source of truth, reused everywhere.
 *
 * Must run after generateSeoPages.ts (needs the finished HTML and the
 * flushed date manifest); order relative to generateSitemap.ts does not
 * matter, since this reads pageDates.ts directly rather than the sitemap.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { lookupDate } from './pageDates.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'public');
const SITE = 'https://www.languagelineage.org';

// Deliberately independent of GUIDE_SLUGS in generateSitemap.ts and GUIDES in
// generateSeoPages.ts, matching this codebase's existing convention (each
// generator script keeps its own minimal list rather than importing across
// scripts) - the actual title/description always come from the rendered
// HTML, so there is nothing here that can drift out of sync with the page.
const STORY_PATHS = [
  '/rankings/most-influential',
  '/guides/what-is-compiler-bootstrapping',
  '/guides/what-is-self-hosting',
  '/guides/compiler-vs-interpreter-vs-runtime',
  '/guides/programming-language-family-tree',
  '/guides/how-javascript-engines-work',
  '/guides/how-python-is-implemented',
  '/guides/how-rust-is-bootstrapped',
  '/guides/gcc-vs-llvm',
  '/guides/how-programming-languages-are-made',
  '/guides/v8-vs-spidermonkey-vs-javascriptcore',
  '/guides/typescript-vs-javascript-implementation',
  '/guides/graalvm-vs-hotspot',
  '/guides/the-c-bootstrap-chain',
];

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

// RSS requires XML-escaping, which is the opposite direction of the HTML
// decoding above - the source HTML has entities decoded to plain text, then
// re-escaped for the feed's own XML syntax.
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// RSS 2.0 requires RFC 822 dates; the manifest stores plain "YYYY-MM-DD".
// Treated as midnight UTC - these are day-granularity content dates, not
// timestamps, so there is no real hour to report.
function toRfc822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

interface FeedItem {
  url: string;
  title: string;
  description: string;
  pubDate: string;
}

function loadItem(path: string): FeedItem {
  const filePath = join(PUBLIC, path.replace(/^\//, ''), 'index.html');
  const html = readFileSync(filePath, 'utf8');
  const title = clean(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? path);
  const description = clean(
    html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1] ?? ''
  );
  return {
    url: `${SITE}${path}`,
    title,
    description,
    pubDate: lookupDate(path),
  };
}

function main() {
  const items = STORY_PATHS.map(loadItem).sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1));

  const itemsXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${toRfc822(item.pubDate)}</pubDate>
    </item>`
    )
    .join('\n');

  const buildDate = toRfc822(items[0]?.pubDate ?? new Date().toISOString().slice(0, 10));

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Language Lineage</title>
    <link>${SITE}</link>
    <description>Guides and data stories on what programming languages are written in, how compilers are bootstrapped, and how languages influenced each other.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>
`;

  writeFileSync(join(PUBLIC, 'rss.xml'), rss, 'utf8');
  console.log(`Generated rss.xml with ${items.length} items`);
}

main();
