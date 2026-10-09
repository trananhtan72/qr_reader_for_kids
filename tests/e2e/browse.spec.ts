import { expect, test } from '@playwright/test';

test('Home → Pictures → item → back to the same spot in the grid', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Pictures' }).click();
  await expect(page).toHaveURL(/\/browse$/);
  const cards = page.locator('.item-card');
  await expect(cards).toHaveCount(20);

  const fan = page.getByRole('link', { name: 'Fan' });
  await fan.scrollIntoViewIfNeeded();
  const scrolled = await page.evaluate(() => window.scrollY);
  expect(scrolled).toBeGreaterThan(0);
  await fan.click();

  await expect(page).toHaveURL(/\/item\/fan$/);
  await expect(page.getByRole('heading', { name: 'Fan' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to pictures' }).click();
  await expect(page).toHaveURL(/\/browse$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrolled);
});

test('cards are big enough to tap and fit a 375px screen', async ({ page }) => {
  await page.goto('/browse');
  const box = (await page.locator('.item-card').first().boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(96);
  expect(box.height).toBeGreaterThanOrEqual(96);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('an item opened directly has Home, not Back', async ({ page }) => {
  await page.goto('/item/fan');
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back to pictures' })).toHaveCount(0);
});
