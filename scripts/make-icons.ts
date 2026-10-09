// Renders public/icons/*.png from one SVG design using Playwright's Chromium.
// Run after changing the design: `npm run icons` (output is committed).
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'public/icons';

/** `pad` shrinks the artwork toward the center (maskable icons need an 80% safe zone). */
function svg(pad: number, rounded: boolean): string {
  const s = 1 - pad * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="#ffd166"/>
  <g transform="translate(${256 * (1 - s)} ${256 * (1 - s)}) scale(${s})">
    <!-- a little label tag -->
    <rect x="96" y="96" width="320" height="320" rx="64" fill="#fff"/>
    <!-- QR finder corners -->
    <g fill="none" stroke="#2b2140" stroke-width="22">
      <rect x="140" y="140" width="76" height="76" rx="14"/>
      <rect x="296" y="140" width="76" height="76" rx="14"/>
      <rect x="140" y="296" width="76" height="76" rx="14"/>
    </g>
    <g fill="#2b2140">
      <rect x="164" y="164" width="28" height="28" rx="4"/>
      <rect x="320" y="164" width="28" height="28" rx="4"/>
      <rect x="164" y="320" width="28" height="28" rx="4"/>
    </g>
    <!-- speaker / sound in the 4th corner -->
    <circle cx="334" cy="334" r="56" fill="#e8551f"/>
    <path d="M312 318h14l20-16v64l-20-16h-14z" fill="#fff"/>
  </g>
</svg>`;
}

const targets: [name: string, size: number, pad: number, rounded: boolean][] = [
  ['apple-touch-icon.png', 180, 0, false], // iOS rounds corners itself
  ['icon-192.png', 192, 0, true],
  ['icon-512.png', 512, 0, true],
  ['maskable-512.png', 512, 0.1, false],
];

mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/icon.svg`, svg(0, true));
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad, rounded] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg(pad, rounded)}`,
  );
  await page.screenshot({ path: `${OUT}/${name}`, omitBackground: true });
  console.log(`${OUT}/${name}`);
}
await browser.close();
