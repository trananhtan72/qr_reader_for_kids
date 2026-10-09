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

/** The origin printed into labels: the configured deploy origin, else wherever the app is running. */
export function labelOrigin(configured: string | undefined, current: string): string {
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through to the current origin
    }
  }
  return current;
}

export function labelUrl(origin: string, id: string): string {
  return `${origin}/item/${id}`;
}

/** True when labels made for this origin won't work outside this network (or ever). */
export function isLocalOrigin(origin: string): boolean {
  let host: string;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:') return true;
    host = url.hostname;
  } catch {
    return true;
  }
  return (
    host === 'localhost' ||
    host.endsWith('.local') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === '[::1]'
  );
}
