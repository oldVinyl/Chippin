import { test, expect } from '@playwright/test';
test('organizer signs in, creates a pot and downloads its donor book', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByLabel('Email address').fill('ama@chippin.local');
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.DEMO_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Hello, Ama.' }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Start a pot', exact: true })
    .last()
    .click();
  await page
    .getByLabel('Give your pot a name')
    .fill(`A little good ${Date.now()}`);
  await page
    .getByLabel('The story behind it')
    .fill('Our family is bringing a little help to the school library.');
  await page.getByLabel('Payout MoMo number').fill('0241234567');
  await page.getByRole('button', { name: 'Create my pot' }).click();
  await expect(
    page.getByRole('heading', { name: /A little good/ }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download CSV' }).click();
  expect((await download).suggestedFilename()).toBe('chippin-donor-book.csv');
  await expect(
    page.getByRole('button', { name: 'Close pot & release funds' }),
  ).toBeVisible();
});
test('admin access is gated and seeded admin can review reconciliation', async ({
  page,
}) => {
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'Admin access required.' }),
  ).toBeVisible();
  await page.goto('/login');
  await page
    .getByLabel('Email address')
    .fill(process.env.ADMIN_EMAIL ?? 'admin@chippin.local');
  await page
    .getByLabel('Password', { exact: true })
    .fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Hello, Chippin.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Admin console' }).click();
  await expect(
    page.getByRole('heading', { name: 'Admin console' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Organizer verification' }),
  ).toBeVisible();
});
