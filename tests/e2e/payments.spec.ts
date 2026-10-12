import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { encrypt, phoneHash } from '../../apps/api/src/security';
const requireApi = createRequire(`${process.cwd()}/apps/api/package.json`);
const { PrismaClient } = requireApi('@prisma/client');
const { PrismaPg } = requireApi('@prisma/adapter-pg');
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
let code = '';
test.beforeEach(async () => {
  if (process.env.MOMO_MODE !== 'mock')
    throw new Error('Browser payment tests require mock mode.');
  const organizer = await db.organizer.create({
    data: {
      name: 'Ama Mensah',
      email: `browser-${randomUUID()}@test.local`,
      phoneEnc: encrypt('233241234560'),
      phoneHash: phoneHash(randomUUID()),
      passwordHash: 'not-a-login',
      phoneVerifiedAt: new Date(),
      verificationStatus: 'VERIFIED',
    },
  });
  code = randomUUID().slice(0, 8).toUpperCase();
  await db.pot.create({
    data: {
      code,
      name: 'A fresh start for Akwaaba School',
      story: 'An isolated browser test for our school fundraiser.',
      slug: 'browser-test',
      cover: 5,
      organizerId: organizer.id,
      payoutMsisdnEnc: encrypt('233241234560'),
      payoutAccountName: 'Ama Mensah',
      targetMinor: 500000,
    },
  });
});
test.afterAll(() => db.$disconnect());
test('a friend joins by code and sees a confirmed receipt', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('Pot code', { exact: true }).fill(code);
  await page.getByRole('button', { name: 'Find my pot' }).click();
  await expect(
    page.getByRole('heading', { name: 'A fresh start for Akwaaba School' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Chip In', exact: true }).click();
  await page
    .getByLabel('Your MoMo number')
    .fill(`024${String(Date.now()).slice(-7)}`);
  await page.getByLabel('Your name (optional)').fill('A demo friend');
  await page.getByRole('checkbox', { name: /I’m 18/ }).check();
  await page.getByRole('button', { name: /Chip In.*50/ }).click();
  await expect(
    page.getByRole('heading', { name: 'A little from you. A lot of love.' }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.reference')).toHaveText(/[a-f0-9-]{36}/);
  await page.getByRole('link', { name: 'Back to the pot' }).click();
  await page.waitForURL(`**/p/${code}`);
  await expect(
    page.getByText('A demo friend', { exact: true }).first(),
  ).toBeVisible();
});
test('a declined payment offers a clear retry without counting it', async ({
  page,
}) => {
  await page.goto(`/p/${code}/pay`);
  await page
    .getByLabel('Your MoMo number')
    .fill(`024${String(Date.now() + 1000).slice(-7)}`);
  await page.getByLabel('Demo payment outcome').selectOption('declined');
  await page.getByRole('checkbox', { name: /I’m 18/ }).check();
  await page.getByRole('button', { name: /Chip In.*50/ }).click();
  await expect(
    page.getByRole('heading', { name: 'That payment didn’t go through.' }),
  ).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole('link', { name: 'Try again' })).toBeVisible();
});
test('the page fits a 320 pixel screen and text zoom', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Good things happen/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.addStyleTag({ content: 'body{font-size:36px}' });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
