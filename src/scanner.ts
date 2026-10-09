import QrScanner from 'qr-scanner';
import { getItem, type Item } from './items';
import { labelOrigin } from './origin';
import { itemIdFromUrl } from './router';

export type ScanOutcome =
  | { kind: 'item'; item: Item }
  | { kind: 'unknown'; id: string } // our label, but an id this build doesn't know
  | { kind: 'foreign' }; // anything else: other sites, plain text, …

/** Origins whose labels count as "ours": where the app runs, plus the origin labels are printed with. */
export function appOrigins(configured: string | undefined, current: string): string[] {
  return [...new Set([current, labelOrigin(configured, current)])];
}

/** Pure: decide what a decoded QR payload means. Never returns a URL to open. */
export function classifyScan(text: string, origins: readonly string[], lookup = getItem): ScanOutcome {
  for (const origin of origins) {
    const id = itemIdFromUrl(text, origin);
    if (id) {
      const item = lookup(id);
      return item ? { kind: 'item', item } : { kind: 'unknown', id };
    }
  }
  return { kind: 'foreign' };
}

export type CameraError = 'insecure' | 'denied' | 'no-camera' | 'other';

export function cameraErrorKind(err: unknown): CameraError {
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'insecure';
  const name = err instanceof Error ? err.name : '';
  const msg = String(err instanceof Error ? err.message : err);
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || /camera not found/i.test(msg)) return 'no-camera';
  return 'other';
}

export interface Scanner {
  /** Ask for the camera and start decoding. Rejects with the getUserMedia error. */
  start(): Promise<void>;
  /** Stop decoding and release the camera (all tracks). Safe to call twice. */
  destroy(): void;
}

/**
 * Wraps qr-scanner. Frames are decoded on-device in a Web Worker and never stored or sent.
 * `onText` gets every decoded payload; the caller decides what (if anything) to do with it.
 */
export function createScanner(video: HTMLVideoElement, onText: (text: string) => void): Scanner {
  // iOS: inline playback + muted are required for getUserMedia video to show at all.
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.muted = true;
  video.setAttribute('autoplay', '');

  const scanner = new QrScanner(video, (result) => onText(result.data), {
    preferredCamera: 'environment',
    maxScansPerSecond: 8,
    returnDetailedScanResult: true,
  });
  let destroyed = false;
  return {
    async start() {
      try {
        await scanner.start();
      } catch (err) {
        // qr-scanner swallows getUserMedia errors and reports "Camera not found."; ask once
        // ourselves so a denied permission isn't mistaken for a missing camera.
        throw (await probeCameraError()) ?? err;
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      scanner.destroy();
      // Belt and braces: make sure the camera light goes off.
      const stream = video.srcObject;
      if (stream instanceof MediaStream) stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
  };
}

async function probeCameraError(): Promise<unknown> {
  if (!navigator.mediaDevices?.getUserMedia) return undefined;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    return undefined;
  } catch (err) {
    return err;
  }
}
