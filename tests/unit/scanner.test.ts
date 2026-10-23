import { describe, expect, it } from 'vitest';
import { appOrigins, cameraErrorKind, classifyScan, idFromPlainText } from '../../src/scanner';

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

  it.each(['fridge', ' Fridge\n', 'TV', 'washing-machine', 'Washing Machine', 'washing_machine'])(
    'accepts plain-text id %j (sticker printers)',
    (text) => {
      expect(classifyScan(text, [here]).kind).toBe('item');
    },
  );

  it('maps plain text to the right item', () => {
    const r = classifyScan('Washing machine', [here]);
    expect(r.kind === 'item' && r.item.id).toBe('washing-machine');
  });

  it.each(['spaceship', 'frige', 'fridge please', 'Refrigerator', '12345', 'fridge!'])(
    'treats unknown plain text %j as foreign, not as an unknown label',
    (text) => {
      expect(classifyScan(text, [here])).toEqual({ kind: 'foreign' });
    },
  );

  it.each([
    'https://evil.example/item/fridge',
    'https://evil.example/fridge',
    'fridge://x',
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

describe('idFromPlainText', () => {
  it('normalizes case, whitespace and separators', () => {
    expect(idFromPlainText('  Washing   Machine ')).toBe('washing-machine');
    expect(idFromPlainText('GAS_STOVE')).toBe('gas-stove');
  });
  it('rejects text that cannot be an id', () => {
    expect(idFromPlainText('')).toBeNull();
    expect(idFromPlainText('a/b')).toBeNull();
    expect(idFromPlainText('https://kids.example/item/fridge')).toBeNull();
  });
});
