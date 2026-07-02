import { test, expect, Page } from '@playwright/test';

const WIDTHS = [320, 390, 768, 1440];

const PAGES = [
  { path: '/languages/python/', label: 'python' },
  { path: '/languages/rust/', label: 'rust' },
  { path: '/guides/what-is-compiler-bootstrapping/', label: 'guide-bootstrapping' },
  { path: '/questions/what-is-python-written-in/', label: 'question-python' },
  { path: '/languages/javascript/', label: 'javascript' },
];

async function checkNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(overflow, 'page has horizontal overflow').toBe(false);
}

for (const width of WIDTHS) {
  for (const { path, label } of PAGES) {
    test(`${label} at ${width}px — no overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded');
      await checkNoOverflow(page);
    });
  }
}

test('TOC anchors navigate on python page', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 800 });
  await page.goto('/languages/python/');
  // Find a TOC link and click it
  const tocLink = page.locator('.page-toc-list a').first();
  const href = await tocLink.getAttribute('href');
  expect(href).toMatch(/^#/);
  await tocLink.click();
  // The target heading should be visible
  const targetId = href!.slice(1);
  await expect(page.locator(`#${targetId}`)).toBeVisible();
});

test('tables scroll internally on python page at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/languages/python/');
  const wrappers = page.locator('.table-wrap');
  const count = await wrappers.count();
  expect(count).toBeGreaterThan(0);
  // Each wrapper should have overflow-x: auto
  for (let i = 0; i < count; i++) {
    const overflow = await wrappers.nth(i).evaluate(el =>
      getComputedStyle(el).overflowX
    );
    expect(overflow).toBe('auto');
  }
});
