import { expect, test } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { extname, join } from 'path';
import { pathToFileURL } from 'url';

function decodeHtml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

test('generated embed snippet loads from a plain file page', async ({ page }) => {
  const datasetPage = readFileSync(join(process.cwd(), 'dataset/index.html'), 'utf8');
  const encodedSnippet = datasetPage.match(/<pre class="embed-code"><code>([\s\S]*?)<\/code><\/pre>/)?.[1];
  expect(encodedSnippet, 'dataset page has an iframe snippet').toBeTruthy();

  const productionSnippet = decodeHtml(encodedSnippet!);
  expect(productionSnippet).toContain('src="https://www.languagelineage.org/embed?lang=rust"');
  expect(productionSnippet).toContain('height="500"');

  const fixturePath = join(tmpdir(), 'language-lineage-embed-test.html');
  writeFileSync(fixturePath, `<!doctype html><html><body>${productionSnippet}</body></html>`, 'utf8');

  // Serve the production build through the production origin without an HTTP server.
  // This preserves the exact absolute snippet while keeping the test deterministic.
  await page.route('https://www.languagelineage.org/**', async route => {
    const url = new URL(route.request().url());
    const relativePath = url.pathname === '/embed'
      ? 'index.html'
      : url.pathname.replace(/^\//, '');
    const filePath = join(process.cwd(), 'dist', relativePath);
    if (!existsSync(filePath)) {
      await route.fulfill({ status: 404, body: 'Not found' });
      return;
    }
    const contentTypes: Record<string, string> = {
      '.css': 'text/css',
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.woff2': 'font/woff2',
    };
    await route.fulfill({
      status: 200,
      contentType: contentTypes[extname(filePath)] ?? 'application/octet-stream',
      body: readFileSync(filePath),
    });
  });

  await page.goto(pathToFileURL(fixturePath).href);
  const iframe = page.locator('iframe');
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute('title', 'Rust relationship graph');
  await expect(page.frameLocator('iframe').locator('[data-embed-state="ready"]')).toBeVisible({ timeout: 20_000 });
});
