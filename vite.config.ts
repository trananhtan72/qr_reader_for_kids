import { defineConfig } from 'vitest/config';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ command, isPreview }) => ({
  // Self-signed HTTPS for the dev server only, so a real iPhone on the LAN can use the camera.
  plugins: command === 'serve' && !isPreview ? [basicSsl()] : [],
  appType: 'spa', // serve index.html for /item/<id> etc.
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
}));
