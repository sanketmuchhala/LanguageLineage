# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: embed.spec.ts >> generated embed snippet loads from a plain file page
- Location: tests/embed.spec.ts:15:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('iframe').contentFrame().locator('[data-embed-state="ready"]')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('iframe').contentFrame().locator('[data-embed-state="ready"]')

```

```yaml
- text: normalizeDataset is not defined
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | import { existsSync, readFileSync, writeFileSync } from 'fs';
  3  | import { tmpdir } from 'os';
  4  | import { extname, join } from 'path';
  5  | import { pathToFileURL } from 'url';
  6  |
  7  | function decodeHtml(value: string): string {
  8  |   return value
  9  |     .replace(/&lt;/g, '<')
  10 |     .replace(/&gt;/g, '>')
  11 |     .replace(/&quot;/g, '"')
  12 |     .replace(/&amp;/g, '&');
  13 | }
  14 |
  15 | test('generated embed snippet loads from a plain file page', async ({ page }) => {
  16 |   const datasetPage = readFileSync(join(process.cwd(), 'dataset/index.html'), 'utf8');
  17 |   const encodedSnippet = datasetPage.match(/<pre class="embed-code"><code>([\s\S]*?)<\/code><\/pre>/)?.[1];
  18 |   expect(encodedSnippet, 'dataset page has an iframe snippet').toBeTruthy();
  19 |
  20 |   const productionSnippet = decodeHtml(encodedSnippet!);
  21 |   expect(productionSnippet).toContain('src="https://www.languagelineage.org/embed?lang=rust"');
  22 |   expect(productionSnippet).toContain('height="500"');
  23 |
  24 |   const fixturePath = join(tmpdir(), 'language-lineage-embed-test.html');
  25 |   writeFileSync(fixturePath, `<!doctype html><html><body>${productionSnippet}</body></html>`, 'utf8');
  26 |
  27 |   // Serve the production build through the production origin without an HTTP server.
  28 |   // This preserves the exact absolute snippet while keeping the test deterministic.
  29 |   await page.route('https://www.languagelineage.org/**', async route => {
  30 |     const url = new URL(route.request().url());
  31 |     const relativePath = url.pathname === '/embed'
  32 |       ? 'index.html'
  33 |       : url.pathname.replace(/^\//, '');
  34 |     const filePath = join(process.cwd(), 'dist', relativePath);
  35 |     if (!existsSync(filePath)) {
  36 |       await route.fulfill({ status: 404, body: 'Not found' });
  37 |       return;
  38 |     }
  39 |     const contentTypes: Record<string, string> = {
  40 |       '.css': 'text/css',
  41 |       '.html': 'text/html',
  42 |       '.js': 'text/javascript',
  43 |       '.json': 'application/json',
  44 |       '.png': 'image/png',
  45 |       '.svg': 'image/svg+xml',
  46 |       '.woff2': 'font/woff2',
  47 |     };
  48 |     await route.fulfill({
  49 |       status: 200,
  50 |       contentType: contentTypes[extname(filePath)] ?? 'application/octet-stream',
  51 |       body: readFileSync(filePath),
  52 |     });
  53 |   });
  54 |
  55 |   await page.goto(pathToFileURL(fixturePath).href);
  56 |   const iframe = page.locator('iframe');
  57 |   await expect(iframe).toBeVisible();
  58 |   await expect(iframe).toHaveAttribute('title', 'Rust relationship graph');
> 59 |   await expect(page.frameLocator('iframe').locator('[data-embed-state="ready"]')).toBeVisible({ timeout: 20_000 });
     |                                                                                   ^ Error: expect(locator).toBeVisible() failed
  60 | });
  61 |
```