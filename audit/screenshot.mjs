// Temporary audit tooling: capture screenshots of key routes at several viewports.
// Usage: node audit/screenshot.mjs [baseUrl] [outDir]
// Removed during Phase 11 cleanup.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = process.argv[2] || 'http://localhost:5174';
const OUT = process.argv[3] || 'audit/before';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'lg', width: 1024, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

// fullPage: capture entire scroll height (content pages). graph routes use viewport only.
const routes = [
  { name: 'home', path: '/', fullPage: true },
  { name: 'explore', path: '/explore', fullPage: false, settle: 4000 },
  { name: 'language-python', path: '/languages/python', fullPage: true },
  { name: 'tool-llvm', path: '/tools/llvm', fullPage: true },
  { name: 'timeline', path: '/timeline', fullPage: true },
  { name: 'dataset', path: '/dataset', fullPage: true },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let count = 0;
for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  for (const r of routes) {
    try {
      await page.goto(`${BASE}${r.path}`, { waitUntil: 'networkidle', timeout: 30000 });
    } catch {
      await page.goto(`${BASE}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }
    await page.waitForTimeout(r.settle || 900);
    // For full-page content shots, only do it on desktop + mobile to keep the set small.
    const fullPage = r.fullPage && (vp.name === 'desktop' || vp.name === 'mobile');
    const file = join(OUT, `${r.name}-${vp.name}.png`);
    await page.screenshot({ path: file, fullPage });
    count++;
    console.log(`saved ${file}${fullPage ? ' (full)' : ''}`);
  }
  await ctx.close();
}
await browser.close();
console.log(`\nDone: ${count} screenshots in ${OUT}`);
