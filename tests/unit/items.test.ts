import { describe, expect, it } from 'vitest';
import raw from '../../src/data/items.json';
import { getItem, items, validateItems } from '../../src/items';

const ok = { id: 'fridge', name: 'Refrigerator', lang: 'en-US' };

describe('validateItems', () => {
  it('accepts the shipped items.json', () => {
    expect(validateItems(raw)).toEqual([]);
  });

  it('accepts a minimal item', () => {
    expect(validateItems([ok])).toEqual([]);
  });

  it('rejects non-arrays and non-objects', () => {
    expect(validateItems({})).toHaveLength(1);
    expect(validateItems([null])).toHaveLength(1);
  });

  it('requires id, name and lang', () => {
    expect(validateItems([{}])).toHaveLength(3);
  });

  it.each(['Fridge', 'gas stove', 'gas_stove', '-x', 'x-', 'a--b', ''])('rejects bad id %j', (id) => {
    expect(validateItems([{ ...ok, id }]).join()).toMatch(/id must be/);
  });

  it('validates syllable timings', () => {
    const timed = { ...ok, syllables: ['re', 'frig'], audio: '/audio/fridge.mp3' };
    expect(validateItems([{ ...timed, syllableTimes: [0, 0.3] }])).toEqual([]);
    expect(validateItems([{ ...timed, syllableTimes: [0.3, 0.1] }]).join()).toMatch(/ascending/);
    expect(validateItems([{ ...timed, syllableTimes: [-1, 0.1] }]).join()).toMatch(/ascending/);
    expect(validateItems([{ ...timed, syllableTimes: [0] }]).join()).toMatch(/one time per syllable/);
    expect(validateItems([{ ...timed, syllableTimesSlow: [0, 0.5] }]).join()).toMatch(/only makes sense with audioSlow/);
  });

  it('rejects duplicate ids', () => {
    expect(validateItems([ok, ok]).join()).toMatch(/duplicate/);
  });

  it('rejects wrongly-typed optional fields', () => {
    expect(validateItems([{ ...ok, emoji: 3 }]).join()).toMatch(/emoji/);
    expect(validateItems([{ ...ok, audio: '' }]).join()).toMatch(/audio/);
    expect(validateItems([{ ...ok, syllables: 're-frig' }]).join()).toMatch(/syllables/);
    expect(validateItems([{ ...ok, syllables: ['re', ''] }]).join()).toMatch(/syllables/);
  });
});

describe('getItem', () => {
  it('finds seed items by id', () => {
    expect(items.length).toBe(20);
    expect(getItem('fridge')?.name).toBe('Refrigerator');
  });

  it('returns undefined for unknown ids', () => {
    expect(getItem('xyz')).toBeUndefined();
    expect(getItem('')).toBeUndefined();
    expect(getItem('__proto__')).toBeUndefined();
  });
});
