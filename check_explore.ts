import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error));

  await page.goto('http://localhost:5173/explore');
  await page.waitForTimeout(5000);

  await browser.close();
})();
