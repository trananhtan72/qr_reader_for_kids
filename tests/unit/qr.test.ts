import { describe, expect, it } from 'vitest';
import { isLocalOrigin, labelOrigin, labelUrl, QUIET_ZONE, qrPath } from '../../src/qr';

describe('labelOrigin', () => {
  it('prefers the configured origin, normalized', () => {
    expect(labelOrigin('https://kids.example/some/path/', 'https://192.168.1.5:5173')).toBe('https://kids.example');
  });
  it('falls back to the current origin when unset or invalid', () => {
    expect(labelOrigin(undefined, 'https://a.example')).toBe('https://a.example');
    expect(labelOrigin('', 'https://a.example')).toBe('https://a.example');
    expect(labelOrigin('not a url', 'https://a.example')).toBe('https://a.example');
  });
});

describe('labelUrl', () => {
  it('builds /item/<id>', () => {
    expect(labelUrl('https://kids.example', 'washing-machine')).toBe('https://kids.example/item/washing-machine');
  });
});

describe('isLocalOrigin', () => {
  it.each([
    'http://kids.example',
    'https://localhost:5173',
    'https://127.0.0.1',
    'https://192.168.1.20:5173',
    'https://10.0.0.4',
    'https://172.20.1.1',
    'https://my-mac.local',
    'garbage',
  ])('flags %s', (o) => expect(isLocalOrigin(o)).toBe(true));

  it.each(['https://kids.example', 'https://user.github.io', 'https://172.15.0.1'])('accepts %s', (o) =>
    expect(isLocalOrigin(o)).toBe(false),
  );
});

describe('qrPath', () => {
  it('produces a square code with a quiet zone and finder patterns', () => {
    const { size, d } = qrPath('https://kids.example/item/fridge');
    const modules = size - 2 * QUIET_ZONE;
    expect((modules - 17) % 4).toBe(0); // valid QR version size
    expect(modules).toBeLessThanOrEqual(33); // short URLs stay small (≤ version 4) for 1.5" labels
    // Top-left finder pattern starts dark at the quiet-zone corner.
    expect(d.startsWith(`M${QUIET_ZONE} ${QUIET_ZONE}h1v1h-1z`)).toBe(true);
  });

  it('is deterministic and differs per text', () => {
    expect(qrPath('https://a.example/item/x').d).toBe(qrPath('https://a.example/item/x').d);
    expect(qrPath('https://a.example/item/x').d).not.toBe(qrPath('https://a.example/item/y').d);
  });
});
