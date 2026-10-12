const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.BROWSER_BASE_URL || 'http://localhost:3000';
(async () => {
  const browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  fs.mkdirSync('docs/screenshots', { recursive: true });
  await page.screenshot({
    path: 'docs/screenshots/landing-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'docs/screenshots/landing-mobile.png',
    fullPage: true,
  });
  await page.goto(`${base}/p/AKWAABA`);
  await page.waitForSelector('.pot-summary');
  await page.screenshot({
    path: 'docs/screenshots/pot-mobile.png',
    fullPage: true,
  });
  console.log({
    errors,
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  });
  await browser.close();
})();
