import { h } from '../dom';
import { t } from '../i18n';
import { items, type Item } from '../items';
import type { Cleanup } from '../router';

/** Picture grid of every item, for practicing without labels. */
export function render(root: HTMLElement): Cleanup {
  root.append(
    h(
      'section',
      { class: 'browse', 'data-testid': 'browse' },
      h(
        'header',
        { class: 'browse-header' },
        h('a', { class: 'btn-corner static', href: '/', 'aria-label': t.home }, h('span', { 'aria-hidden': 'true' }, '🏠')),
        h('h1', { class: 'title' }, t.browseTitle),
      ),
      h('ul', { class: 'grid', role: 'list' }, ...items.map((item, i) => h('li', {}, card(item, i)))),
    ),
  );
  return () => {};
}

function card(item: Item, index: number): HTMLElement {
  const pic = h('span', { class: 'card-pic', 'aria-hidden': 'true' });
  const emoji = () => h('span', { class: 'emoji' }, item.emoji ?? '⭐');
  if (item.image) {
    const img = h('img', { src: item.image, alt: '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', () => img.replaceWith(emoji()), { once: true });
    pic.append(img);
  } else {
    pic.append(emoji());
  }
  const a = h(
    'a',
    { class: 'item-card', href: `/item/${item.id}`, 'data-from-browse': true, lang: item.lang },
    pic,
    h('span', { class: 'card-name' }, item.name),
  );
  a.style.setProperty('--i', String(index)); // staggered pop-in
  return a;
}
