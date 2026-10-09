import { describe, expect, it } from 'vitest';
import type { Item } from '../../src/items';
import { activeSyllable, syllableTimesFor } from '../../src/syllables';

const base: Item = { id: 'sofa', name: 'Sofa', lang: 'en-US', syllables: ['so', 'fa'] };

describe('syllableTimesFor', () => {
  it('returns timings only for a recorded file with matching data', () => {
    const item = { ...base, audio: '/audio/sofa.mp3', syllableTimes: [0.1, 0.4] };
    expect(syllableTimesFor(item, 'normal')).toEqual([0.1, 0.4]);
    expect(syllableTimesFor(item, 'slow')).toBeUndefined(); // no slow file/timings → word pulses
  });

  it('is undefined for TTS-only items or mismatched lengths', () => {
    expect(syllableTimesFor({ ...base, syllableTimes: [0.1, 0.4] }, 'normal')).toBeUndefined();
    expect(syllableTimesFor({ ...base, audio: '/a.mp3', syllableTimes: [0.1] }, 'normal')).toBeUndefined();
  });

  it('uses the slow timings for the slow file', () => {
    const item = { ...base, audioSlow: '/audio/sofa-slow.mp3', syllableTimesSlow: [0.2, 0.9] };
    expect(syllableTimesFor(item, 'slow')).toEqual([0.2, 0.9]);
  });
});

describe('activeSyllable', () => {
  const times = [0.1, 0.4, 0.8];
  it.each([
    [0, -1],
    [0.1, 0],
    [0.39, 0],
    [0.4, 1],
    [0.8, 2],
    [5, 2],
  ])('at %ss → %i', (t, want) => expect(activeSyllable(times, t)).toBe(want));
});
