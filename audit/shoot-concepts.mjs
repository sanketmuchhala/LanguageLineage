// Capture design-review concept previews. Dev-only, removed in Phase 11.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = process.argv[2] || 'http://localhost:5174';
const OUT = 'audit/concepts';
mkdirSync(OUT, { recursive: true });

const routes = [
  { name: 'index', path: '/design-review' },
  { name: 'compiler-atlas', path: '/design-review/compiler-atlas' },
  { name: 'runtime-observatory', path: '/design-review/runtime-observatory' },
  { name: 'source-archive', path: '/design-review/source-archive' },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

for (const r of routes) {
  await page.goto(`${BASE}${r.path}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1200);
  // hero / top fold
  await page.screenshot({ path: join(OUT, `${r.name}-top.png`) });
  console.log(`saved ${r.name}-top.png`);
  if (r.name !== 'index') {
    // full scroll of all four experiences
    await page.screenshot({ path: join(OUT, `${r.name}-full.png`), fullPage: true });
    console.log(`saved ${r.name}-full.png`);
  }
}
await ctx.close();
await browser.close();
console.log('done');
