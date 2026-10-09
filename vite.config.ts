import { defineConfig } from 'vitest/config';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { copyFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const THEME = '#ffd166';

/** Manifest + service worker. Everything the app can show is precached, so the house works offline. */
const pwa = VitePWA({
  // 'prompt': a new version waits until the app is fully closed (or a parent taps Update)
  // instead of reloading under a child's fingers.
  registerType: 'prompt',
  injectRegister: false, // registered from src/pwa.ts
  manifest: {
    name: "What's This?",
    short_name: "What's This?",
    description: 'Scan labels around the house to hear what things are called.',
    lang: 'en',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: THEME,
    background_color: '#fff8e7',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,webp,jpg,mp3,m4a,json,woff2}'],
    globIgnores: ['404.html'],
    // SPA: any navigation (e.g. /item/fridge from the Camera app) is answered with the cached shell.
    navigateFallback: '/index.html',
    cleanupOutdatedCaches: true,
    // Control the page on the very first visit, so it's offline-ready without a reload.
    // (No skipWaiting: later updates still wait — see registerType.)
    clientsClaim: true,
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  },
});

/** GitHub Pages SPA fallback: serve the app for unknown paths like /item/fridge. (Netlify/Cloudflare use public/_redirects.) */
const spa404: Plugin = {
  name: 'spa-404',
  apply: 'build',
  writeBundle(opts) {
    copyFileSync(`${opts.dir}/index.html`, `${opts.dir}/404.html`);
  },
};

export default defineConfig(({ command, isPreview }) => ({
  // Self-signed HTTPS for the dev server only, so a real iPhone on the LAN can use the camera.
  plugins: [pwa, spa404, ...(command === 'serve' && !isPreview ? [basicSsl()] : [])],
  appType: 'spa', // serve index.html for /item/<id> etc.
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
}));
