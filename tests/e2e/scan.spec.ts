// Scanner flow, Chromium only (WebKit has no fake camera). The camera shows our fridge label.
import { expect, test, type Page } from '@playwright/test';
import { fakeCamera, ORIGIN } from './fixtures/qrVideo';

test.use(fakeCamera(`${ORIGIN}/item/fridge`, 'fridge'));

/** Records every camera stream so we can check the light goes off. */
async function trackStreams(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __streams: MediaStream[] };
    w.__streams = [];
    const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (c) => {
      const s = await orig(c);
      w.__streams.push(s);
      return s;
    };
  });
}
const liveTracks = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { __streams: MediaStream[] }).__streams.flatMap((s) => s.getTracks()).filter((t) => t.readyState === 'live').length,
  );

test('Home → Scan shows the item in place, auto-plays, and Scan again loops 20×', async ({ page }) => {
  test.setTimeout(120_000);
  await trackStreams(page);
  await page.goto('/');
  await page.getByTestId('scan-button').click();
  await expect(page).toHaveURL(/\/scan$/);

  for (let i = 0; i < 20; i++) {
    await expect(page.getByRole('heading', { name: 'Refrigerator' }), `scan #${i + 1}`).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/scan$/); // shown in place, no navigation
    // Audio was unlocked by the Scan tap, so it played itself instead of inviting a tap.
    await expect(page.getByRole('button', { name: 'Hear it' })).not.toHaveClass(/invite/);
    await page.getByRole('button', { name: 'Scan again' }).click();
    await expect(page.getByTestId('scan')).toBeVisible();
  }
  expect(await page.evaluate(() => (window as unknown as { __streams: unknown[] }).__streams.length)).toBe(1); // camera never restarted

  await page.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => liveTracks(page)).toBe(0);
});

test('opening /scan directly (no tap yet) invites a tap instead of autoplaying', async ({ page }) => {
  await page.goto('/scan');
  await expect(page.getByRole('heading', { name: 'Refrigerator' })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Hear it' })).toHaveClass(/invite/);
});

test('camera permission denied shows a friendly error with Try again', async ({ page, context }) => {
  await context.clearPermissions();
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await page.goto('/scan');
  await expect(page.getByTestId('camera-error')).toHaveAttribute('data-kind', 'denied');
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
});
