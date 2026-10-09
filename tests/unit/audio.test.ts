import { describe, expect, it } from 'vitest';
import { chooseSource, pickVoice } from '../../src/audio';
import type { Item } from '../../src/items';

const base: Item = { id: 'fridge', name: 'Refrigerator', nickname: 'Fridge', lang: 'en-US' };
const recorded: Item = { ...base, audio: '/audio/fridge.mp3', audioSlow: '/audio/fridge-slow.mp3' };

describe('chooseSource', () => {
  it('prefers recorded files', () => {
    expect(chooseSource(recorded, 'normal')).toEqual({ kind: 'file', src: '/audio/fridge.mp3' });
    expect(chooseSource(recorded, 'slow')).toEqual({ kind: 'file', src: '/audio/fridge-slow.mp3' });
  });

  it('falls back to TTS at 0.9 / 0.6', () => {
    expect(chooseSource(base, 'normal')).toEqual({ kind: 'tts', text: 'Refrigerator', lang: 'en-US', rate: 0.9 });
    expect(chooseSource(base, 'slow')).toEqual({ kind: 'tts', text: 'Refrigerator', lang: 'en-US', rate: 0.6 });
  });

  it('uses slow TTS, not the normal file, when only audio exists', () => {
    expect(chooseSource({ ...base, audio: '/audio/fridge.mp3' }, 'slow')).toMatchObject({ kind: 'tts', rate: 0.6 });
  });

  it('speaks the nickname via TTS, falling back to the name', () => {
    expect(chooseSource(recorded, 'normal', 'nickname')).toMatchObject({ kind: 'tts', text: 'Fridge' });
    expect(chooseSource({ ...base, nickname: undefined }, 'normal', 'nickname')).toMatchObject({ text: 'Refrigerator' });
  });
});

describe('pickVoice', () => {
  const v = (lang: string, localService = true, isDefault = false) => ({ lang, localService, default: isDefault });

  it('prefers an exact language match', () => {
    const voices = [v('en-GB'), v('en-US'), v('fr-FR')];
    expect(pickVoice(voices, 'en-US')).toBe(voices[1]);
  });

  it('prefers on-device voices among equal matches', () => {
    const voices = [v('en-US', false), v('en-US', true)];
    expect(pickVoice(voices, 'en-US')).toBe(voices[1]);
  });

  it('falls back to the same base language and normalizes case/underscores', () => {
    const voices = [v('fr-FR'), v('en_gb')];
    expect(pickVoice(voices, 'en-US')).toBe(voices[1]);
  });

  it('returns undefined when nothing matches', () => {
    expect(pickVoice([v('fr-FR')], 'en-US')).toBeUndefined();
    expect(pickVoice([], 'en-US')).toBeUndefined();
  });
});
