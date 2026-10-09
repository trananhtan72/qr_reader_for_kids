// Pure helpers for `npm run media` (kept separate so they can be unit tested).
import type { Item } from '../src/items';

export const AUDIO_EXTS = ['mp3', 'm4a'] as const; // m4a = iPhone Voice Memos export
export const IMAGE_EXTS = ['webp', 'png', 'jpg'] as const;

const KEY_ORDER: (keyof Item)[] = [
  'id', 'name', 'nickname', 'lang', 'syllables', 'syllableTimes', 'syllableTimesSlow',
  'emoji', 'image', 'audio', 'audioSlow',
];

export interface LinkResult {
  items: Item[];
  /** Human-readable "fridge: audio → /audio/fridge.mp3" lines. */
  linked: string[];
  /** Files in public/audio or public/images that match no item id (probably a typo). */
  orphans: string[];
}

/**
 * Fills in `image`, `audio`, `audioSlow` from files named after item ids.
 * `files` are public-relative paths like "/audio/fridge.mp3". Existing fields are left alone.
 */
export function linkMedia(items: readonly Item[], files: readonly string[]): LinkResult {
  const have = new Set(files);
  const used = new Set<string>();
  const linked: string[] = [];
  const find = (dir: string, base: string, exts: readonly string[]) =>
    exts.map((e) => `/${dir}/${base}.${e}`).find((p) => have.has(p));

  const out = items.map((item) => {
    const next: Item = { ...item };
    const slots: [keyof Item, string | undefined][] = [
      ['image', find('images', item.id, IMAGE_EXTS)],
      ['audio', find('audio', item.id, AUDIO_EXTS)],
      ['audioSlow', find('audio', `${item.id}-slow`, AUDIO_EXTS)],
    ];
    for (const [key, path] of slots) {
      const current = next[key] as string | undefined;
      if (current) {
        used.add(current);
      } else if (path) {
        (next as unknown as Record<string, unknown>)[key] = path;
        used.add(path);
        linked.push(`${item.id}: ${key} → ${path}`);
      }
    }
    return next;
  });

  const orphans = files.filter((f) => /^\/(audio|images)\//.test(f) && !used.has(f));
  return { items: out, linked, orphans };
}

/** items.json style: one item per line, keys in a stable order. */
export function formatItems(items: readonly Item[]): string {
  const value = (v: unknown): string => (Array.isArray(v) ? `[${v.map((x) => JSON.stringify(x)).join(', ')}]` : JSON.stringify(v));
  const line = (item: Item) => {
    const rec = item as unknown as Record<string, unknown>;
    const keys = [...KEY_ORDER.filter((k) => k in rec), ...Object.keys(rec).filter((k) => !KEY_ORDER.includes(k as keyof Item))];
    return `  { ${keys.filter((k) => rec[k] !== undefined).map((k) => `${JSON.stringify(k)}: ${value(rec[k])}`).join(', ')} }`;
  };
  return `[\n${items.map(line).join(',\n')}\n]\n`;
}
