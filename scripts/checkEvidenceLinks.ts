/**
 * Stage 1 item 8 of IMPLEMENTATION_PLAN.md.
 *
 * Checks that every unique evidence_source URL in dataset/v5/lineage_v5.json
 * actually resolves. 443/443 cited evidence is this site's core
 * differentiator; a dead citation quietly undermines that on launch day.
 *
 * This is deliberately NOT wired into `npm run seo:validate`. That gate must
 * stay green on a machine with no network and must never fail on a source
 * site's transient 503 — this script depends on the live internet and is
 * meant to be run periodically and reviewed by a human, not as a build gate.
 *
 * Read-only: this never touches dataset/v5/lineage_v5.json. Per CLAUDE.md,
 * evidence_source values require a human review step before any change, so
 * failures are reported here for manual follow-up, never auto-rewritten.
 *
 * Run: npm run check:evidence-links
 */
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATASET_PATH = join(ROOT, 'dataset/v5/lineage_v5.json');
const REPORTS_DIR = join(ROOT, 'reports');

const USER_AGENT = 'LanguageLineageBot/1.0 (+https://www.languagelineage.org/dataset; evidence-link-checker)';
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const CONCURRENCY = 8;

interface Relationship {
  from_language: string;
  to_language: string;
  relationship: string;
  evidence_source: string;
}

type Outcome = 'OK' | 'CLIENT_ERROR' | 'SERVER_ERROR' | 'NETWORK_ERROR';

interface CheckResult {
  url: string;
  outcome: Outcome;
  status: number | null;
  finalUrl: string | null;
  error: string | null;
  relationships: Relationship[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** HEAD first (cheap); some hosts reject HEAD outright, so retry with GET
 *  before concluding failure. Retries transient errors with backoff. */
async function checkUrl(url: string): Promise<Omit<CheckResult, 'url' | 'relationships'>> {
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(attempt * 1000);

    for (const method of ['HEAD', 'GET'] as const) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          method,
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'User-Agent': USER_AGENT },
        });
        clearTimeout(timer);

        // Some hosts (observed: Cloudflare-fronted sites returning a bare
        // 404 for HEAD while GET succeeds) reject HEAD with a status that
        // looks like a real failure. Never trust a non-2xx/3xx from HEAD on
        // its own — confirm with GET before concluding the URL is dead.
        if (method === 'HEAD' && !(res.status >= 200 && res.status < 400)) {
          continue;
        }

        if (res.status >= 200 && res.status < 400) {
          return { outcome: 'OK', status: res.status, finalUrl: res.url !== url ? res.url : null, error: null };
        }
        if (res.status >= 400 && res.status < 500) {
          return { outcome: 'CLIENT_ERROR', status: res.status, finalUrl: null, error: null };
        }
        // 5xx: worth a retry at the outer loop.
        lastError = `HTTP ${res.status}`;
        break;
      } catch (err) {
        clearTimeout(timer);
        lastError = err instanceof Error ? err.message : String(err);
        break;
      }
    }
  }

  return { outcome: 'NETWORK_ERROR', status: null, finalUrl: null, error: lastError };
}

async function runPool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function next(): Promise<void> {
    const i = cursor++;
    if (i >= items.length) return;
    results[i] = await worker(items[i]);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
  return results;
}

async function main() {
  const data = JSON.parse(readFileSync(DATASET_PATH, 'utf8'));
  const relationships: Relationship[] = data.relationships;

  const byUrl = new Map<string, Relationship[]>();
  for (const rel of relationships) {
    if (!rel.evidence_source) continue;
    const list = byUrl.get(rel.evidence_source) ?? [];
    list.push(rel);
    byUrl.set(rel.evidence_source, list);
  }

  const urls = [...byUrl.keys()].sort();
  console.log(`Checking ${urls.length} unique evidence_source URLs (${relationships.length} relationships)...\n`);

  const startedAt = Date.now();
  const checked = await runPool(urls, CONCURRENCY, async (url) => {
    const result = await checkUrl(url);
    return { url, relationships: byUrl.get(url)!, ...result } satisfies CheckResult;
  });
  const elapsedS = ((Date.now() - startedAt) / 1000).toFixed(1);

  const ok = checked.filter((r) => r.outcome === 'OK');
  const redirected = ok.filter((r) => r.finalUrl !== null);
  const clientErrors = checked.filter((r) => r.outcome === 'CLIENT_ERROR');
  const serverErrors = checked.filter((r) => r.outcome === 'SERVER_ERROR');
  const networkErrors = checked.filter((r) => r.outcome === 'NETWORK_ERROR');
  const failures = [...clientErrors, ...serverErrors, ...networkErrors];

  console.log('='.repeat(80));
  console.log('EVIDENCE LINK CHECK SUMMARY');
  console.log('='.repeat(80));
  console.log(`Checked in ${elapsedS}s`);
  console.log(`  OK:             ${ok.length}${redirected.length ? ` (${redirected.length} redirected)` : ''}`);
  console.log(`  Client error:   ${clientErrors.length}`);
  console.log(`  Server error:   ${serverErrors.length}`);
  console.log(`  Network error:  ${networkErrors.length}`);
  console.log();

  if (failures.length > 0) {
    console.log('FAILURES — review manually, do not auto-fix:\n');
    for (const f of failures) {
      const label = f.status ? `HTTP ${f.status}` : f.error ?? 'unknown error';
      console.log(`FAIL  ${label.padEnd(14)} ${f.url}`);
      for (const rel of f.relationships) {
        console.log(`        ${rel.from_language} -> ${rel.to_language} (${rel.relationship})`);
      }
    }
    console.log();
  } else {
    console.log('No dead evidence sources found.\n');
  }

  if (redirected.length > 0) {
    console.log('REDIRECTS — resolve fine today, but worth confirming the destination still supports the claim:\n');
    for (const r of redirected) {
      console.log(`REDIRECT  ${r.url}\n          -> ${r.finalUrl}`);
    }
    console.log();
  }

  // Persist the full report for later reference; reports/ is gitignored.
  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = join(REPORTS_DIR, `evidence-link-check-${new Date().toISOString().slice(0, 10)}.md`);
  const lines: string[] = [
    `# Evidence link check — ${new Date().toISOString()}`,
    '',
    `${urls.length} unique URLs across ${relationships.length} relationships. ${failures.length} failure(s), ${redirected.length} redirect(s).`,
    '',
    '## Failures',
    '',
    ...(failures.length === 0
      ? ['None.']
      : failures.flatMap((f) => [
          `- **${f.status ? `HTTP ${f.status}` : f.error ?? 'unknown error'}** ${f.url}`,
          ...f.relationships.map((r) => `  - ${r.from_language} -> ${r.to_language} (${r.relationship})`),
        ])),
    '',
    '## Redirects',
    '',
    ...(redirected.length === 0 ? ['None.'] : redirected.map((r) => `- ${r.url} -> ${r.finalUrl}`)),
  ];
  writeFileSync(reportPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Full report: ${reportPath.replace(ROOT + '/', '')}`);

  if (failures.length > 0) process.exitCode = 1;
}

main();
