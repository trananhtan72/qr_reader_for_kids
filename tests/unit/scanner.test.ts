import { describe, expect, it } from 'vitest';
import { appOrigins, cameraErrorKind, classifyScan } from '../../src/scanner';

const here = 'https://kids.example';

describe('appOrigins', () => {
  it('includes the running origin and the configured label origin, deduplicated', () => {
    expect(appOrigins(undefined, here)).toEqual([here]);
    expect(appOrigins('https://kids.example/', here)).toEqual([here]);
    expect(appOrigins('https://kids.example', 'https://192.168.1.5:5173')).toEqual([
      'https://192.168.1.5:5173',
      'https://kids.example',
    ]);
  });
});

describe('classifyScan', () => {
  it('recognizes our labels', () => {
    const r = classifyScan(`${here}/item/fridge`, [here]);
    expect(r.kind).toBe('item');
    expect(r.kind === 'item' && r.item.name).toBe('Refrigerator');
  });

  it('accepts labels printed for the deploy origin while running elsewhere', () => {
    const origins = appOrigins(here, 'https://192.168.1.5:5173');
    expect(classifyScan(`${here}/item/tv`, origins).kind).toBe('item');
    expect(classifyScan('https://192.168.1.5:5173/item/tv', origins).kind).toBe('item');
  });

  it('reports well-formed but unknown ids on our origin', () => {
    expect(classifyScan(`${here}/item/spaceship`, [here])).toEqual({ kind: 'unknown', id: 'spaceship' });
  });

  it.each([
    'https://evil.example/item/fridge',
    `${here}.evil.com/item/fridge`,
    `${here}/labels`,
    `${here}/`,
    'hello world',
    'WIFI:S:home;T:WPA;P:secret;;',
    'javascript:alert(1)',
    '',
  ])('treats %j as foreign', (text) => {
    expect(classifyScan(text, [here])).toEqual({ kind: 'foreign' });
  });
});

describe('cameraErrorKind', () => {
  const err = (name: string, message = '') => Object.assign(new Error(message), { name });
  it('maps getUserMedia errors', () => {
    expect(cameraErrorKind(err('NotAllowedError'))).toBe('denied');
    expect(cameraErrorKind(err('SecurityError'))).toBe('denied');
    expect(cameraErrorKind(err('NotFoundError'))).toBe('no-camera');
    expect(cameraErrorKind('Camera not found.')).toBe('no-camera');
    expect(cameraErrorKind(err('NotReadableError'))).toBe('other');
  });
});
