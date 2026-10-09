// The camera shows one of our labels with an id this build doesn't know.
import { expect, test } from '@playwright/test';
import { fakeCamera, ORIGIN } from './fixtures/qrVideo';

test.use(fakeCamera(`${ORIGIN}/item/spaceship`, 'unknown'));

test('shows the friendly unknown page with Scan again', async ({ page }) => {
  await page.goto('/scan');
  await expect(page.getByText("I don't know this one yet")).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Scan again' }).click();
  await expect(page.getByTestId('scan')).toBeVisible();
});
