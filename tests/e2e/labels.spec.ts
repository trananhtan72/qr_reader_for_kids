import { expect, test } from '@playwright/test';

test('labels page renders a QR code and word for every item', async ({ page }) => {
  await page.goto('/labels');
  await expect(page.getByRole('heading', { name: 'Print labels' })).toBeVisible();
  await expect(page.locator('.label svg.qr')).toHaveCount(20);
  await expect(page.getByRole('img', { name: /\/item\/fridge$/ })).toBeVisible();
  await expect(page.getByTestId('label-origin')).toHaveText('http://localhost:4173');
  await expect(page.getByRole('note')).toContainText('local address');
});

test('unticked labels are hidden when printing', async ({ page }) => {
  await page.goto('/labels');
  await page.getByRole('button', { name: 'Select none' }).click();
  await page.getByRole('checkbox', { name: 'Refrigerator' }).check();
  await expect(page.getByText('1 of 20 labels selected')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.label:visible')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /Print/ })).toBeHidden();
});

test('label size changes the printed size', async ({ page }) => {
  await page.goto('/labels');
  await page.getByLabel('Label size').selectOption('3');
  const box = await page.locator('.label').first().boundingBox();
  expect(Math.round(box!.width)).toBe(288); // 3in at 96 CSS px/in
});

test('the ⚙ gate on Home needs a press-and-hold', async ({ page }) => {
  await page.goto('/');
  const gear = page.getByRole('button', { name: 'Grown-ups: press and hold' });
  await gear.click();
  await page.waitForTimeout(2500);
  await expect(page).toHaveURL(/\/$/);

  const box = (await gear.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2300);
  await page.mouse.up();
  await expect(page).toHaveURL(/\/labels$/);
});
