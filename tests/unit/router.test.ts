import { describe, expect, it } from 'vitest';
import { itemIdFromUrl, matchRoute } from '../../src/router';

describe('matchRoute', () => {
  it('matches home', () => {
    expect(matchRoute('/')).toEqual({ name: 'home', params: {} });
  });

  it('matches /item/:id with or without trailing slash', () => {
    expect(matchRoute('/item/fridge')).toEqual({ name: 'item', params: { id: 'fridge' } });
    expect(matchRoute('/item/washing-machine/')).toEqual({ name: 'item', params: { id: 'washing-machine' } });
  });

  it('matches /labels', () => {
    expect(matchRoute('/labels')).toEqual({ name: 'labels', params: {} });
    expect(matchRoute('/labels/')).toEqual({ name: 'labels', params: {} });
  });

  it('passes unknown ids to the item view (it shows the friendly page)', () => {
    expect(matchRoute('/item/xyz')).toEqual({ name: 'item', params: { id: 'xyz' } });
  });

  it('treats malformed paths as notFound', () => {
    expect(matchRoute('/item')).toEqual({ name: 'notFound', params: {} });
    expect(matchRoute('/item/')).toEqual({ name: 'notFound', params: {} });
    expect(matchRoute('/item/a/b')).toEqual({ name: 'notFound', params: {} });
    expect(matchRoute('/item/%E0%A4%A')).toEqual({ name: 'notFound', params: {} });
    expect(matchRoute('/nope')).toEqual({ name: 'notFound', params: {} });
  });
});

describe('itemIdFromUrl', () => {
  const origin = 'https://kids.example';

  it('extracts the id from our own label URLs', () => {
    expect(itemIdFromUrl('https://kids.example/item/fridge', origin)).toBe('fridge');
    expect(itemIdFromUrl(' https://kids.example/item/tv/ ', origin)).toBe('tv');
    expect(itemIdFromUrl('https://kids.example/item/fridge?x=1#y', origin)).toBe('fridge');
  });

  it('ignores other origins, even look-alikes', () => {
    expect(itemIdFromUrl('https://evil.example/item/fridge', origin)).toBeNull();
    expect(itemIdFromUrl('http://kids.example/item/fridge', origin)).toBeNull();
    expect(itemIdFromUrl('https://kids.example.evil.com/item/fridge', origin)).toBeNull();
    expect(itemIdFromUrl('https://kids.example:8443/item/fridge', origin)).toBeNull();
  });

  it('ignores non-URLs and other paths', () => {
    expect(itemIdFromUrl('fridge', origin)).toBeNull();
    expect(itemIdFromUrl('javascript:alert(1)', origin)).toBeNull();
    expect(itemIdFromUrl('https://kids.example/labels', origin)).toBeNull();
    expect(itemIdFromUrl('https://kids.example/item/Fridge', origin)).toBeNull();
    expect(itemIdFromUrl('https://kids.example/item/a/b', origin)).toBeNull();
  });
});
