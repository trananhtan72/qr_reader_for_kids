import { create } from 'qrcode';

/** Quiet zone in modules around the code. The label's white padding adds more. */
export const QUIET_ZONE = 2;

/** Pure: QR text → square size (incl. quiet zone) and one SVG path drawing the dark modules. */
export function qrPath(text: string): { size: number; d: string } {
  const { modules } = create(text, { errorCorrectionLevel: 'M' });
  const parts: string[] = [];
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) parts.push(`M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`);
    }
  }
  return { size: modules.size + QUIET_ZONE * 2, d: parts.join('') };
}
