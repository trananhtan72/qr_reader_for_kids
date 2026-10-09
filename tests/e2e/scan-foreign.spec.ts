// The camera shows a QR code from another site.
import { expect, test } from '@playwright/test';
import { fakeCamera, ORIGIN } from './fixtures/qrVideo';

test.use(fakeCamera('https://example.com/item/fridge', 'foreign'));

test('shows a gentle message and never navigates', async ({ page }) => {
  await page.goto('/scan');
  await expect(page.getByRole('alert')).toHaveText(/not one of our labels/);
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(`${ORIGIN}/scan`);
  await expect(page.getByTestId('item')).toHaveCount(0);
});
