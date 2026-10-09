import { defineConfig, devices } from '@playwright/test';

/** Specs that need Chromium-only features: a fake camera (scan*) or service-worker offline emulation (pwa). */
const CHROMIUM_ONLY = /(scan.*|pwa)\.spec/;

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    { name: 'webkit', use: { ...devices['iPhone SE'] }, testIgnore: CHROMIUM_ONLY },
    {
      name: 'chromium',
      use: { ...devices['Pixel 5'], viewport: { width: 375, height: 667 } },
      testMatch: CHROMIUM_ONLY,
    },
  ],
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
