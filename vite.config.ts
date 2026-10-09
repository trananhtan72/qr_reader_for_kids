import { defineConfig } from 'vitest/config';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { copyFileSync } from 'node:fs';
import type { Plugin } from 'vite';

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
  plugins: [spa404, ...(command === 'serve' && !isPreview ? [basicSsl()] : [])],
  appType: 'spa', // serve index.html for /item/<id> etc.
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
}));
