import type { Speed } from './audio';
import type { Item } from './items';

/**
 * Syllable start times (seconds) for the recorded file that will play, or undefined when
 * highlighting can't be timed (TTS, no recording, or no timing data) — then the word pulses instead.
 */
export function syllableTimesFor(item: Item, speed: Speed): number[] | undefined {
  const file = speed === 'slow' ? item.audioSlow : item.audio;
  const times = speed === 'slow' ? item.syllableTimesSlow : item.syllableTimes;
  if (!file || !times || !item.syllables || times.length !== item.syllables.length) return undefined;
  return times;
}

/** Index of the syllable being spoken at `t` seconds, or -1 before the first one starts. */
export function activeSyllable(times: readonly number[], t: number): number {
  let active = -1;
  for (let i = 0; i < times.length && times[i] <= t; i++) active = i;
  return active;
}
