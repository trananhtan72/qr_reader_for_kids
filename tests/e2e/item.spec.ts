import { expect, test } from '@playwright/test';

test('item page shows the word and a play button', async ({ page }) => {
  await page.goto('/item/fridge');
  await expect(page.getByRole('heading', { name: 'Refrigerator' })).toBeVisible();
  await expect(page.getByText('re · frig · er · a · tor')).toBeVisible();
  const hear = page.getByRole('button', { name: 'Hear it' });
  await expect(hear).toBeVisible();
  await expect(page.getByRole('button', { name: 'Slowly' })).toBeInViewport();
  const box = await hear.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(96);
  await hear.click(); // must not throw even without voices
  await expect(page).toHaveURL(/\/item\/fridge$/);
});

test('page fits a 375px screen without horizontal scroll', async ({ page }) => {
  for (const id of ['fridge', 'washing-machine', 'tv']) {
    await page.goto(`/item/${id}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, id).toBeLessThanOrEqual(0);
  }
});

test('unknown id shows a friendly page with a Home button', async ({ page }) => {
  await page.goto('/item/xyz');
  await expect(page.getByText("I don't know this one yet")).toBeVisible();
  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL(/\/$/);
});
