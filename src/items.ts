import rawItems from './data/items.json';

export interface Item {
  id: string;
  name: string;
  lang: string;
  nickname?: string;
  syllables?: string[];
  emoji?: string;
  image?: string;
  audio?: string;
  audioSlow?: string;
  /** Start time (s) of each syllable in `audio`, for highlighting. Same length as `syllables`. */
  syllableTimes?: number[];
  /** Same, for `audioSlow`. */
  syllableTimesSlow?: number[];
}

/** Lowercase slug: letters, digits, single hyphens. Printed on labels, so stable forever. */
export const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const OPTIONAL_STRINGS = ['nickname', 'emoji', 'image', 'audio', 'audioSlow'] as const;

/** Returns a list of human-readable problems; empty means valid. Pure, so the build script reuses it. */
export function validateItems(data: unknown): string[] {
  if (!Array.isArray(data)) return ['items.json must be an array'];
  const errors: string[] = [];
  const seen = new Set<string>();
  data.forEach((raw, i) => {
    const where = `item[${i}]`;
    if (typeof raw !== 'object' || raw === null) {
      errors.push(`${where}: must be an object`);
      return;
    }
    const item = raw as Record<string, unknown>;
    const label = typeof item.id === 'string' ? `${where} "${item.id}"` : where;

    if (typeof item.id !== 'string' || !ID_PATTERN.test(item.id)) {
      errors.push(`${label}: id must be a lowercase slug (a-z, 0-9, -)`);
    } else if (seen.has(item.id)) {
      errors.push(`${label}: duplicate id`);
    } else {
      seen.add(item.id);
    }
    if (typeof item.name !== 'string' || item.name.trim() === '') {
      errors.push(`${label}: name is required`);
    }
    if (typeof item.lang !== 'string' || !/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(item.lang)) {
      errors.push(`${label}: lang is required (BCP 47, e.g. "en-US")`);
    }
    for (const key of OPTIONAL_STRINGS) {
      if (item[key] !== undefined && (typeof item[key] !== 'string' || item[key] === '')) {
        errors.push(`${label}: ${key} must be a non-empty string if present`);
      }
    }
    if (
      item.syllables !== undefined &&
      !(Array.isArray(item.syllables) && item.syllables.every((s) => typeof s === 'string' && s !== ''))
    ) {
      errors.push(`${label}: syllables must be an array of non-empty strings if present`);
    }
    for (const key of ['syllableTimes', 'syllableTimesSlow'] as const) {
      const times = item[key];
      if (times === undefined) continue;
      const syllables = Array.isArray(item.syllables) ? item.syllables : [];
      const ascending =
        Array.isArray(times) &&
        times.every((n, j) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && (j === 0 || n > times[j - 1]));
      if (!ascending) errors.push(`${label}: ${key} must be ascending numbers ≥ 0 (seconds)`);
      else if (times.length !== syllables.length) errors.push(`${label}: ${key} needs one time per syllable`);
      else if (item[key === 'syllableTimes' ? 'audio' : 'audioSlow'] === undefined)
        errors.push(`${label}: ${key} only makes sense with ${key === 'syllableTimes' ? 'audio' : 'audioSlow'}`);
    }
  });
  return errors;
}

/** Every local asset path an item references (relative to public/). */
export function assetPaths(item: Item): string[] {
  return [item.image, item.audio, item.audioSlow].filter((p): p is string => typeof p === 'string');
}

// Build-time `npm run validate` guarantees the shape; keep a runtime guard so a bad
// edit degrades to "unknown item" instead of crashing the app.
const runtimeErrors = validateItems(rawItems);
if (runtimeErrors.length > 0) console.error('items.json problems:', runtimeErrors);

export const items: readonly Item[] = runtimeErrors.length === 0 ? (rawItems as Item[]) : [];

const byId = new Map(items.map((item) => [item.id, item]));

export function getItem(id: string): Item | undefined {
  return byId.get(id);
}
