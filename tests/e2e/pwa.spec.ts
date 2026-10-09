// Chromium: needs service workers and offline emulation.
import { expect, test } from '@playwright/test';

test('manifest is installable and its icons exist', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m).toMatchObject({ display: 'standalone', orientation: 'portrait', start_url: '/' });
  for (const icon of [...m.icons, { src: '/icons/apple-touch-icon.png' }]) {
    expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
  }
});

test('after one visit, every screen works offline', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready;
    return !!navigator.serviceWorker.controller;
  });

  await context.setOffline(true);

  // A label URL as the Camera app would open it.
  await page.goto('/item/tv');
  await expect(page.getByRole('heading', { name: 'Television' })).toBeVisible();

  for (const id of ['fridge', 'washing-machine', 'fan']) {
    await page.goto(`/item/${id}`);
    await expect(page.getByTestId('item')).toBeVisible();
  }

  await page.goto('/browse');
  await expect(page.locator('.item-card')).toHaveCount(20);

  // Lazy chunks (QR generator, scanner + decoder worker) come from the cache too.
  await page.goto('/labels');
  await expect(page.locator('.label svg.qr')).toHaveCount(20);
  await page.goto('/scan');
  await expect(page.getByTestId('scan').or(page.getByTestId('camera-error'))).toBeAttached();

  await page.goto('/parent');
  await expect(page.getByTestId('offline-status')).toContainText('Ready to use without internet');
});
