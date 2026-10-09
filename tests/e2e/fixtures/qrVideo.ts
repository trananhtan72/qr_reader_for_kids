// Writes a tiny Y4M video showing a QR code, for Chromium's fake camera
// (--use-file-for-fake-video-capture). Grayscale: only the Y plane carries the image.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { create } from 'qrcode';

const W = 640;
const H = 480;

export function writeQrVideo(text: string, outPath: string): string {
  const { modules } = create(text, { errorCorrectionLevel: 'M' });
  const scale = Math.floor(300 / (modules.size + 8));
  const px = (modules.size + 8) * scale; // incl. a 4-module quiet zone each side
  const x0 = Math.floor((W - px) / 2);
  const y0 = Math.floor((H - px) / 2);

  const y = Buffer.alloc(W * H, 200); // light grey "wall"
  for (let row = 0; row < px; row++) {
    for (let col = 0; col < px; col++) {
      const mr = Math.floor(row / scale) - 4;
      const mc = Math.floor(col / scale) - 4;
      const dark = mr >= 0 && mc >= 0 && mr < modules.size && mc < modules.size && modules.get(mr, mc);
      y[(y0 + row) * W + x0 + col] = dark ? 16 : 235;
    }
  }
  const chroma = Buffer.alloc((W / 2) * (H / 2) * 2, 128);
  const frame = Buffer.concat([Buffer.from('FRAME\n'), y, chroma]);
  const header = Buffer.from(`YUV4MPEG2 W${W} H${H} F10:1 Ip A1:1 C420jpeg\n`);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, Buffer.concat([header, ...Array(5).fill(frame)]));
  return outPath;
}

/** Playwright `test.use()` options: a camera that keeps showing a QR code for `text`. */
export function fakeCamera(text: string, name: string) {
  const file = writeQrVideo(text, `test-results/fake-camera/${name}.y4m`);
  return {
    permissions: ['camera'],
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${file}`],
    },
  };
}

export const ORIGIN = 'http://localhost:4173';
