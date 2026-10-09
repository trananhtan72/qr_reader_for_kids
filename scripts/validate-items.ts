// Validates src/data/items.json: shape, unique ids, and that referenced files exist in public/.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assetPaths, validateItems, type Item } from '../src/items';

const root = fileURLToPath(new URL('..', import.meta.url));
const data: unknown = JSON.parse(readFileSync(`${root}src/data/items.json`, 'utf8'));

const errors = validateItems(data);
if (errors.length === 0) {
  for (const item of data as Item[]) {
    for (const path of assetPaths(item)) {
      if (!path.startsWith('/')) errors.push(`"${item.id}": ${path} must be an absolute path like /audio/${item.id}.mp3`);
      else if (!existsSync(`${root}public${path}`)) errors.push(`"${item.id}": missing file public${path}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`items.json: ${errors.length} problem(s)\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`items.json OK (${(data as Item[]).length} items)`);
