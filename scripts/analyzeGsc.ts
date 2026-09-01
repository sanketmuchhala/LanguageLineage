/**
 * GSC Measurement Loop Script (Phase 14)
 *
 * Analyzes Google Search Console CSV exports and compares against the
 * baseline from Section 2 of SITE_IMPROVEMENT_PLAN.md.
 *
 * Usage:
 *   npm run gsc:analyze                          # analyze latest export
 *   npm run gsc:analyze -- --dir path/to/export  # analyze a specific export
 *
 * Expects a directory containing Queries.csv and Pages.csv in the standard
 * GSC Performance export format.
 *
 * Outputs:
 *   - Comparison against the 2026-06-25 baseline
 *   - Decision-rule recommendations per Phase 14 criteria
 *   - A measurement-log row ready to paste into SITE_IMPROVEMENT_PLAN.md
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REPORTS_DIR = join(ROOT, 'reports', 'GSC SEO rep');

// ---------------------------------------------------------------------------
// Baseline from Section 2 (2026-06-25)
// ---------------------------------------------------------------------------

interface QueryBaseline {
  query: string;
  impressions: number;
  position: number;
  ctr: number;
}

interface PageBaseline {
  page: string;
  impressions: number;
  clicks: number;
  position: number;
}

const BASELINE_QUERIES: QueryBaseline[] = [
  { query: 'rust language', impressions: 122, position: 56.4, ctr: 0 },
  { query: 'what is rust written in', impressions: 108, position: 9.5, ctr: 0 },
  { query: 'what language is python written in', impressions: 85, position: 35.3, ctr: 0 },
  { query: 'what language is javascript written in', impressions: 79, position: 9.8, ctr: 0 },
  { query: 'what is javascript written in', impressions: 54, position: 9.7, ctr: 0 },
  { query: 'rust language release date', impressions: 50, position: 53.7, ctr: 0 },
  { query: 'what is go written in', impressions: 39, position: 8.7, ctr: 0 },
  { query: 'is javascript written in c', impressions: 31, position: 9.5, ctr: 0 },
  { query: 'what language is java written in', impressions: 31, position: 10.3, ctr: 0 },
  { query: 'bootstrapping compiler', impressions: 17, position: 43, ctr: 0 },
];

const BASELINE_PAGES: PageBaseline[] = [
  { page: '/languages/rust', impressions: 898, clicks: 2, position: 29.7 },
  { page: '/languages/javascript', impressions: 467, clicks: 1, position: 14.2 },
  { page: '/languages/go', impressions: 283, clicks: 1, position: 11.3 },
  { page: '/languages/python', impressions: 259, clicks: 0, position: 25.3 },
  { page: '/languages/java', impressions: 149, clicks: 0, position: 12.6 },
  { page: '/guides/what-is-compiler-bootstrapping', impressions: 113, clicks: 0, position: 31.3 },
  { page: '/questions/what-is-rust-written-in', impressions: 88, clicks: 0, position: 10.1 },
  { page: '/guides/programming-language-family-tree', impressions: 45, clicks: 2, position: 8.8 },
  { page: '/', impressions: 54, clicks: 1, position: 7.3 },
  { page: '/dataset', impressions: 17, clicks: 0, position: 29.7 },
];

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = parseRow(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parsePct(s: string): number {
  return parseFloat(s.replace('%', '')) || 0;
}

// ---------------------------------------------------------------------------
// Find the latest GSC export directory
// ---------------------------------------------------------------------------

function findLatestExport(overrideDir?: string): string {
  if (overrideDir) {
    const resolved = resolve(overrideDir);
    if (!existsSync(resolved)) {
      console.error(`Directory not found: ${resolved}`);
      process.exit(1);
    }
    return resolved;
  }

  if (!existsSync(REPORTS_DIR)) {
    console.error(`Reports directory not found: ${REPORTS_DIR}`);
    console.error('Export GSC data into reports/GSC SEO rep/ first.');
    process.exit(1);
  }

  const dirs = readdirSync(REPORTS_DIR)
    .filter(name => {
      const p = join(REPORTS_DIR, name);
      return statSync(p).isDirectory() && name.startsWith('languagelineage.org');
    })
    .sort()
    .reverse();

  if (dirs.length === 0) {
    console.error('No GSC export directories found in reports/GSC SEO rep/');
    process.exit(1);
  }

  return join(REPORTS_DIR, dirs[0]);
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

function delta(current: number, baseline: number): string {
  const diff = current - baseline;
  if (diff === 0) return '=';
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}`;
}

function positionDelta(current: number, baseline: number): string {
  // Lower position is better
  const diff = current - baseline;
  if (Math.abs(diff) < 0.5) return '=';
  const sign = diff > 0 ? '+' : '';
  const arrow = diff < 0 ? ' (improved)' : ' (declined)';
  return `${sign}${diff.toFixed(1)}${arrow}`;
}

function run() {
  // Parse args
  const args = process.argv.slice(2);
  let overrideDir: string | undefined;
  const dirIdx = args.indexOf('--dir');
  if (dirIdx !== -1 && args[dirIdx + 1]) {
    overrideDir = args[dirIdx + 1];
  }

  const exportDir = findLatestExport(overrideDir);
  const exportName = exportDir.split('/').pop() || exportDir;
  console.log(`\nAnalyzing GSC export: ${exportName}\n`);

  // Load CSVs
  const queriesFile = join(exportDir, 'Queries.csv');
  const pagesFile = join(exportDir, 'Pages.csv');
  const devicesFile = join(exportDir, 'Devices.csv');

  if (!existsSync(queriesFile)) {
    console.error(`Missing Queries.csv in ${exportDir}`);
    process.exit(1);
  }
  if (!existsSync(pagesFile)) {
    console.error(`Missing Pages.csv in ${exportDir}`);
    process.exit(1);
  }

  const queries = parseCsv(readFileSync(queriesFile, 'utf8'));
  const pages = parseCsv(readFileSync(pagesFile, 'utf8'));
  const devices = existsSync(devicesFile) ? parseCsv(readFileSync(devicesFile, 'utf8')) : [];

  // Compute totals
  let totalClicks = 0;
  let totalImpressions = 0;
  for (const p of pages) {
    totalClicks += parseInt(p['Clicks'] || '0', 10);
    totalImpressions += parseInt(p['Impressions'] || '0', 10);
  }

  // Mobile stats
  const mobileRow = devices.find(d => (d['Devices'] || d['Device'] || '').toLowerCase() === 'mobile');
  const mobileClicks = mobileRow ? parseInt(mobileRow['Clicks'] || '0', 10) : -1;
  const mobileImpressions = mobileRow ? parseInt(mobileRow['Impressions'] || '0', 10) : -1;

  // -----------------------------------------------------------------------
  // Baseline comparison: queries
  // -----------------------------------------------------------------------

  console.log('='.repeat(72));
  console.log('BASELINE QUERY COMPARISON (vs 2026-06-25)');
  console.log('='.repeat(72));
  console.log('');
  console.log(
    'Query'.padEnd(42) +
    'Imp (b)'.padStart(8) +
    'Imp (c)'.padStart(8) +
    'Pos (b)'.padStart(8) +
    'Pos (c)'.padStart(8) +
    'CTR (c)'.padStart(8)
  );
  console.log('-'.repeat(82));

  for (const bq of BASELINE_QUERIES) {
    const headerKey = Object.keys(queries[0] || {}).find(k => k.toLowerCase().includes('quer')) || 'Top queries';
    const match = queries.find(q => (q[headerKey] || '').toLowerCase() === bq.query.toLowerCase());
    if (match) {
      const imp = parseInt(match['Impressions'] || '0', 10);
      const pos = parseFloat(match['Position'] || '0');
      const ctr = match['CTR'] || '0%';
      console.log(
        bq.query.padEnd(42) +
        String(bq.impressions).padStart(8) +
        String(imp).padStart(8) +
        bq.position.toFixed(1).padStart(8) +
        pos.toFixed(1).padStart(8) +
        ctr.padStart(8)
      );
    } else {
      console.log(
        bq.query.padEnd(42) +
        String(bq.impressions).padStart(8) +
        '(none)'.padStart(8) +
        bq.position.toFixed(1).padStart(8) +
        '(none)'.padStart(8) +
        '(none)'.padStart(8)
      );
    }
  }

  // -----------------------------------------------------------------------
  // Baseline comparison: pages
  // -----------------------------------------------------------------------

  console.log('');
  console.log('='.repeat(72));
  console.log('BASELINE PAGE COMPARISON (vs 2026-06-25)');
  console.log('='.repeat(72));
  console.log('');
  console.log(
    'Page'.padEnd(50) +
    'Cl (b)'.padStart(7) +
    'Cl (c)'.padStart(7) +
    'Imp (b)'.padStart(8) +
    'Imp (c)'.padStart(8) +
    'Pos (b)'.padStart(8) +
    'Pos (c)'.padStart(8)
  );
  console.log('-'.repeat(96));

  const pageHeaderKey = Object.keys(pages[0] || {}).find(k => k.toLowerCase().includes('page')) || 'Top pages';

  for (const bp of BASELINE_PAGES) {
    // GSC may report with or without www, with or without trailing slash
    const match = pages.find(p => {
      const url = (p[pageHeaderKey] || '').replace('https://www.languagelineage.org', '').replace('https://languagelineage.org', '').replace(/\/$/, '') || '/';
      return url === bp.page;
    });
    if (match) {
      const clicks = parseInt(match['Clicks'] || '0', 10);
      const imp = parseInt(match['Impressions'] || '0', 10);
      const pos = parseFloat(match['Position'] || '0');
      console.log(
        bp.page.padEnd(50) +
        String(bp.clicks).padStart(7) +
        String(clicks).padStart(7) +
        String(bp.impressions).padStart(8) +
        String(imp).padStart(8) +
        bp.position.toFixed(1).padStart(8) +
        pos.toFixed(1).padStart(8)
      );
    } else {
      console.log(
        bp.page.padEnd(50) +
        String(bp.clicks).padStart(7) +
        '(none)'.padStart(7) +
        String(bp.impressions).padStart(8) +
        '(none)'.padStart(8) +
        bp.position.toFixed(1).padStart(8) +
        '(none)'.padStart(8)
      );
    }
  }

  // -----------------------------------------------------------------------
  // Decision rules (Phase 14, Task 3)
  // -----------------------------------------------------------------------

  console.log('');
  console.log('='.repeat(72));
  console.log('DECISION RULE RECOMMENDATIONS');
  console.log('='.repeat(72));
  console.log('');

  const recommendations: string[] = [];

  for (const q of queries) {
    const headerKey = Object.keys(q).find(k => k.toLowerCase().includes('quer')) || 'Top queries';
    const query = q[headerKey] || '';
    const imp = parseInt(q['Impressions'] || '0', 10);
    const pos = parseFloat(q['Position'] || '0');
    const ctr = parsePct(q['CTR'] || '0%');

    // Rule: position 10 or better with CTR under 1% after 3+ weeks
    if (pos <= 10 && ctr < 1 && imp >= 5) {
      recommendations.push(
        `ITERATE SNIPPET: "${query}" (pos ${pos.toFixed(1)}, ${imp} imp, ${ctr}% CTR) -- ` +
        'Position is strong but CTR is below 1%. Iterate title/description.'
      );
    }

    // Rule: climbing through positions 15-25
    if (pos >= 15 && pos <= 25 && imp >= 10) {
      recommendations.push(
        `EXPAND CONTENT: "${query}" (pos ${pos.toFixed(1)}, ${imp} imp) -- ` +
        'Climbing through positions 15-25. Consider Phase 4 treatment.'
      );
    }

    // Rule: new query patterns with 10+ impressions
    if (imp >= 10) {
      const isBaseline = BASELINE_QUERIES.some(bq => bq.query.toLowerCase() === query.toLowerCase());
      if (!isBaseline) {
        recommendations.push(
          `NEW PATTERN: "${query}" (pos ${pos.toFixed(1)}, ${imp} imp) -- ` +
          'Not in baseline. Track across pulls before building a dedicated page.'
        );
      }
    }
  }

  if (recommendations.length === 0) {
    console.log('No decision-rule triggers found in this export.');
  } else {
    for (const r of recommendations) {
      console.log(`  - ${r}`);
    }
  }

  // -----------------------------------------------------------------------
  // New queries not in baseline (10+ impressions)
  // -----------------------------------------------------------------------

  console.log('');
  console.log('='.repeat(72));
  console.log('TOP NEW QUERIES (not in baseline, 5+ impressions)');
  console.log('='.repeat(72));
  console.log('');

  const newQueries = queries
    .filter(q => {
      const headerKey = Object.keys(q).find(k => k.toLowerCase().includes('quer')) || 'Top queries';
      const query = (q[headerKey] || '').toLowerCase();
      const imp = parseInt(q['Impressions'] || '0', 10);
      return imp >= 5 && !BASELINE_QUERIES.some(bq => bq.query.toLowerCase() === query);
    })
    .sort((a, b) => parseInt(b['Impressions'] || '0', 10) - parseInt(a['Impressions'] || '0', 10))
    .slice(0, 20);

  if (newQueries.length === 0) {
    console.log('None found.');
  } else {
    for (const q of newQueries) {
      const headerKey = Object.keys(q).find(k => k.toLowerCase().includes('quer')) || 'Top queries';
      console.log(
        `  ${(q[headerKey] || '').padEnd(50)} ${(q['Impressions'] || '').padStart(5)} imp, pos ${parseFloat(q['Position'] || '0').toFixed(1)}, CTR ${q['CTR'] || '0%'}`
      );
    }
  }

  // -----------------------------------------------------------------------
  // Period trend (Chart.csv): last 28 days vs the 28 before it
  // -----------------------------------------------------------------------

  const chartFile = join(exportDir, 'Chart.csv');
  if (existsSync(chartFile)) {
    const chart = parseCsv(readFileSync(chartFile, 'utf8'))
      .filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r['Date'] || ''))
      .sort((a, b) => (a['Date'] || '').localeCompare(b['Date'] || ''));

    if (chart.length >= 56) {
      const sum = (rows: Record<string, string>[]) => rows.reduce(
        (acc, r) => ({
          clicks: acc.clicks + parseInt(r['Clicks'] || '0', 10),
          impressions: acc.impressions + parseInt(r['Impressions'] || '0', 10),
        }),
        { clicks: 0, impressions: 0 }
      );
      const recent = sum(chart.slice(-28));
      const prior = sum(chart.slice(-56, -28));
      const ctr = (t: { clicks: number; impressions: number }) =>
        t.impressions ? (100 * t.clicks / t.impressions).toFixed(2) + '%' : 'n/a';

      console.log('');
      console.log('='.repeat(72));
      console.log('PERIOD TREND (last 28 days vs prior 28)');
      console.log('='.repeat(72));
      console.log('');
      console.log(`  Window:      ${chart[chart.length - 28]['Date']} to ${chart[chart.length - 1]['Date']}`);
      console.log(`  Clicks:      ${prior.clicks} -> ${recent.clicks}`);
      console.log(`  Impressions: ${prior.impressions} -> ${recent.impressions}`);
      console.log(`  CTR:         ${ctr(prior)} -> ${ctr(recent)}`);
    }
  }

  // -----------------------------------------------------------------------
  // Per-section rollup by URL segment
  // -----------------------------------------------------------------------

  const sections = new Map<string, { clicks: number; impressions: number }>();
  const pageKey = Object.keys(pages[0] || {}).find(k => k.toLowerCase().includes('page')) || 'Top pages';
  for (const p of pages) {
    const path = (p[pageKey] || '').replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    const seg = path === '/' || path === '' ? '(home)' : path.split('/')[1];
    const cur = sections.get(seg) || { clicks: 0, impressions: 0 };
    cur.clicks += parseInt(p['Clicks'] || '0', 10);
    cur.impressions += parseInt(p['Impressions'] || '0', 10);
    sections.set(seg, cur);
  }

  console.log('');
  console.log('='.repeat(72));
  console.log('SECTION ROLLUP');
  console.log('='.repeat(72));
  console.log('');
  console.log(`  ${'Section'.padEnd(26)} ${'Clicks'.padStart(7)} ${'Impr'.padStart(8)} ${'CTR'.padStart(8)}`);
  console.log(`  ${'-'.repeat(26)} ${'-'.repeat(7)} ${'-'.repeat(8)} ${'-'.repeat(8)}`);
  for (const [seg, t] of [...sections.entries()].sort((a, b) => b[1].impressions - a[1].impressions)) {
    const ctr = t.impressions ? (100 * t.clicks / t.impressions).toFixed(2) + '%' : 'n/a';
    console.log(`  ${seg.padEnd(26)} ${String(t.clicks).padStart(7)} ${String(t.impressions).padStart(8)} ${ctr.padStart(8)}`);
  }

  // -----------------------------------------------------------------------
  // Query-class split. Definitional queries ("what is X written in") are
  // answered inline by Google, so their impressions rarely convert; the
  // exploratory cluster converts far better and is where effort pays off.
  // -----------------------------------------------------------------------

  const EXPLORATORY = /\b(tree|map|graph|chart|diagram|timeline|genealog|family|visual|evolution|history)\b/i;
  const CONCEPTUAL = /\b(bootstrap|compiler|interpreter|runtime|transpil|self-hosting)\b/i;
  const DEFINITIONAL = /\bwritten in\b|\bwhat is\b|\bwhat language\b|\bimplemented in\b|\bbuilt on\b/i;

  const classes = new Map<string, { clicks: number; impressions: number }>([
    ['exploratory', { clicks: 0, impressions: 0 }],
    ['conceptual', { clicks: 0, impressions: 0 }],
    ['definitional', { clicks: 0, impressions: 0 }],
    ['other', { clicks: 0, impressions: 0 }],
  ]);

  const queryKey = Object.keys(queries[0] || {}).find(k => k.toLowerCase().includes('quer')) || 'Top queries';
  for (const q of queries) {
    const text = q[queryKey] || '';
    // Order matters: exploratory and conceptual win over definitional, since
    // "history of the X programming language" is an exploratory intent.
    const cls = EXPLORATORY.test(text) ? 'exploratory'
      : CONCEPTUAL.test(text) ? 'conceptual'
      : DEFINITIONAL.test(text) ? 'definitional'
      : 'other';
    const cur = classes.get(cls)!;
    cur.clicks += parseInt(q['Clicks'] || '0', 10);
    cur.impressions += parseInt(q['Impressions'] || '0', 10);
  }

  console.log('');
  console.log('='.repeat(72));
  console.log('QUERY CLASS SPLIT');
  console.log('='.repeat(72));
  console.log('');
  console.log(`  ${'Class'.padEnd(26)} ${'Clicks'.padStart(7)} ${'Impr'.padStart(8)} ${'CTR'.padStart(8)}`);
  console.log(`  ${'-'.repeat(26)} ${'-'.repeat(7)} ${'-'.repeat(8)} ${'-'.repeat(8)}`);
  for (const [cls, t] of [...classes.entries()].sort((a, b) => b[1].impressions - a[1].impressions)) {
    const ctr = t.impressions ? (100 * t.clicks / t.impressions).toFixed(2) + '%' : 'n/a';
    console.log(`  ${cls.padEnd(26)} ${String(t.clicks).padStart(7)} ${String(t.impressions).padStart(8)} ${ctr.padStart(8)}`);
  }

  // -----------------------------------------------------------------------
  // Summary and measurement log row
  // -----------------------------------------------------------------------

  // Get sitemap URL count
  let sitemapCount = '?';
  const sitemapPath = join(ROOT, 'public', 'sitemap.xml');
  if (existsSync(sitemapPath)) {
    const sitemap = readFileSync(sitemapPath, 'utf8');
    const matches = sitemap.match(/<url>/g);
    sitemapCount = matches ? String(matches.length) : '?';
  }

  // Extract date from export directory name
  const dateMatch = exportName.match(/(\d{4}-\d{2}-\d{2})/);
  const exportDate = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

  console.log('');
  console.log('='.repeat(72));
  console.log('SUMMARY');
  console.log('='.repeat(72));
  console.log('');
  console.log(`  Export date:       ${exportDate}`);
  console.log(`  Sitemap URLs:      ${sitemapCount}`);
  console.log(`  Total clicks:      ${totalClicks}`);
  console.log(`  Total impressions: ${totalImpressions}`);
  if (mobileClicks >= 0) {
    console.log(`  Mobile clicks:     ${mobileClicks}`);
    console.log(`  Mobile impr:       ${mobileImpressions}`);
  }

  console.log('');
  console.log('Measurement log row (paste into SITE_IMPROVEMENT_PLAN.md):');
  console.log('');
  const notes = totalClicks > 7
    ? `Clicks up from baseline (~7). ${recommendations.length} decision-rule triggers.`
    : `${recommendations.length} decision-rule triggers. CTR still needs work.`;
  console.log(
    `| ${exportDate} | ${sitemapCount} | ${totalClicks} | ${totalImpressions} | ${notes} |`
  );
  console.log('');
}

run();
