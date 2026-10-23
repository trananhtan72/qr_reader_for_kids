// The camera shows a plain-text QR code (as a sticker printer makes), not a URL.
import { expect, test } from '@playwright/test';
import { fakeCamera } from './fixtures/qrVideo';

test.use(fakeCamera('Fridge', 'plaintext'));

test('a plain-text item id opens the item in place', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('scan-button').click();
  await expect(page.getByRole('heading', { name: 'Refrigerator' })).toBeVisible({ timeout: 10_000 });
  await expect(page).toHaveURL(/\/scan$/);
});
