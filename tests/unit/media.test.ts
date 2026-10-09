import { describe, expect, it } from 'vitest';
import { formatItems, linkMedia } from '../../scripts/media';
import type { Item } from '../../src/items';

const fridge: Item = { id: 'fridge', name: 'Refrigerator', lang: 'en-US' };
const tv: Item = { id: 'tv', name: 'Television', lang: 'en-US' };

describe('linkMedia', () => {
  it('links audio, slow audio and images by id', () => {
    const r = linkMedia([fridge, tv], ['/audio/fridge.m4a', '/audio/fridge-slow.mp3', '/images/tv.webp']);
    expect(r.items[0]).toMatchObject({ audio: '/audio/fridge.m4a', audioSlow: '/audio/fridge-slow.mp3' });
    expect(r.items[0].image).toBeUndefined();
    expect(r.items[1].image).toBe('/images/tv.webp');
    expect(r.linked).toHaveLength(3);
    expect(r.orphans).toEqual([]);
  });

  it('prefers mp3 over m4a and webp over png', () => {
    const r = linkMedia([fridge], ['/audio/fridge.m4a', '/audio/fridge.mp3', '/images/fridge.png', '/images/fridge.webp']);
    expect(r.items[0]).toMatchObject({ audio: '/audio/fridge.mp3', image: '/images/fridge.webp' });
    expect(r.orphans).toEqual(['/audio/fridge.m4a', '/images/fridge.png']);
  });

  it('never overwrites existing fields', () => {
    const r = linkMedia([{ ...fridge, audio: '/audio/grandma-fridge.mp3' }], ['/audio/fridge.mp3', '/audio/grandma-fridge.mp3']);
    expect(r.items[0].audio).toBe('/audio/grandma-fridge.mp3');
    expect(r.linked).toEqual([]);
    expect(r.orphans).toEqual(['/audio/fridge.mp3']);
  });

  it('reports files that match no id', () => {
    expect(linkMedia([fridge], ['/audio/frige.mp3']).orphans).toEqual(['/audio/frige.mp3']);
  });
});

describe('formatItems', () => {
  it('writes one item per line with keys in a stable order', () => {
    const out = formatItems([{ audio: '/a.mp3', lang: 'en-US', name: 'TV', id: 'tv', syllables: ['tee', 'vee'] } as Item]);
    expect(out).toBe('[\n  { "id": "tv", "name": "TV", "lang": "en-US", "syllables": ["tee", "vee"], "audio": "/a.mp3" }\n]\n');
  });
});
