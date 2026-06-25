// Route-crawl smoke test: loads representative routes, reports HTTP status,
// console errors, and page errors. Dev-only tooling, removed in Phase 11.
// Usage: node audit/crawl.mjs [baseUrl]
import { chromium } from '@playwright/test';

const BASE = process.argv[2] || 'http://localhost:5174';

const routes = [
  '/', '/explore', '/embed',
  '/languages', '/languages/python', '/languages/rust', '/languages/c',
  '/tools', '/tools/llvm', '/tools/v8',
  '/relationships', '/relationships/compiler-written-in', '/relationships/bootstrap-written-in',
  '/guides', '/guides/what-is-compiler-bootstrapping',
  '/questions', '/questions/what-is-python-written-in',
  '/timeline', '/dataset',
  '/programming-language-graph', '/programming-language-family-tree',
  '/this-route-does-not-exist',
];

const browser = await chromium.launch();
let failures = 0;
const rows = [];

for (const path of routes) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message.slice(0, 120)));
  let status = 0;
  try {
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
    status = resp ? resp.status() : 0;
    await page.waitForTimeout(path === '/explore' ? 3000 : 500);
  } catch (e) {
    errors.push('NAV: ' + e.message.slice(0, 80));
  }
  // ignore noisy third-party analytics blocked in headless
  const real = errors.filter((e) => !/analytics|speed-insights|vitals|favicon|net::ERR_/i.test(e));
  const ok = status > 0 && status < 400 && real.length === 0;
  if (!ok) failures++;
  rows.push({ path, status, errs: real.length, sample: real[0] || '' });
  await ctx.close();
}

console.log('\nRoute                                     status  errors  sample');
console.log('-'.repeat(92));
for (const r of rows) {
  console.log(`${r.path.padEnd(42)} ${String(r.status).padStart(5)}  ${String(r.errs).padStart(6)}  ${r.sample}`);
}
console.log('-'.repeat(92));
console.log(`${rows.length} routes crawled, ${failures} with problems`);
await browser.close();
process.exit(failures > 0 ? 1 : 0);
