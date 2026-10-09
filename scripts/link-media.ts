// `npm run media`: link recordings and pictures to items by file name.
//   public/audio/<id>.mp3|m4a        → audio
//   public/audio/<id>-slow.mp3|m4a   → audioSlow
//   public/images/<id>.webp|png|jpg  → image
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Item } from '../src/items';
import { formatItems, linkMedia } from './media';

const root = fileURLToPath(new URL('..', import.meta.url));
const itemsPath = `${root}src/data/items.json`;
const list = (dir: string) => {
  try {
    return readdirSync(`${root}public/${dir}`).filter((f) => !f.startsWith('.')).map((f) => `/${dir}/${f}`);
  } catch {
    return [];
  }
};

const items = JSON.parse(readFileSync(itemsPath, 'utf8')) as Item[];
const { items: next, linked, orphans } = linkMedia(items, [...list('audio'), ...list('images')]);

if (linked.length) {
  writeFileSync(itemsPath, formatItems(next));
  console.log(`Linked ${linked.length} file(s):\n  ${linked.join('\n  ')}`);
} else {
  console.log('Nothing new to link.');
}
if (orphans.length) {
  console.warn(`\nThese files don't match any item id (check the spelling):\n  ${orphans.join('\n  ')}`);
}
