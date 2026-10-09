import * as audio from '../audio';
import { h } from '../dom';
import { t } from '../i18n';
import { getItem, type Item } from '../items';
import type { Cleanup, Params } from '../router';
import { render as renderNotFound } from './notFound';

export function render(root: HTMLElement, params: Params): Cleanup {
  const item = getItem(params.id ?? '');
  if (!item) return renderNotFound(root);

  audio.preload(item);

  const word = h('h1', { class: 'word', lang: item.lang }, item.name);
  const buttons: HTMLButtonElement[] = [];

  function playWith(opts: audio.PlayOptions, button: HTMLButtonElement) {
    audio.unlock(); // we're inside the tap gesture
    audio.play(item!, {
      ...opts,
      onStart: () => {
        word.classList.add('speaking');
        button.classList.add('active');
      },
      onEnd: () => {
        word.classList.remove('speaking');
        button.classList.remove('active');
      },
    });
  }

  function button(cls: string, icon: string, label: string, opts: audio.PlayOptions, ariaLabel?: string) {
    const b = h(
      'button',
      { type: 'button', class: `btn ${cls}`, 'aria-label': ariaLabel },
      h('span', { class: 'icon', 'aria-hidden': 'true' }, icon),
      label,
    );
    // Stop any in-flight sound/highlight before starting the next one.
    b.addEventListener('click', () => {
      buttons.forEach((other) => other.classList.remove('active'));
      word.classList.remove('speaking');
      playWith(opts, b);
    });
    buttons.push(b);
    return b;
  }

  root.append(
    h(
      'section',
      { class: 'screen item', 'data-testid': 'item' },
      h('a', { class: 'btn-corner', href: '/', 'aria-label': t.home }, h('span', { 'aria-hidden': 'true' }, '🏠')),
      picture(item),
      word,
      item.syllables && item.syllables.length > 1
        ? h('p', { class: 'syllables', 'aria-hidden': 'true' }, item.syllables.join(' · '))
        : null,
      item.nickname
        ? h(
            'p',
            { class: 'nickname' },
            h('span', { lang: item.lang }, t.alsoCalled(item.nickname)),
            button('btn-small', '▶', '', { word: 'nickname' }, t.hearNickname(item.nickname)),
          )
        : null,
      h(
        'div',
        { class: 'actions' },
        button('btn-primary', '▶', t.hearIt, { speed: 'normal' }),
        button('btn-secondary btn-round', '🐢', '', { speed: 'slow' }, t.slowly),
      ),
    ),
  );

  return () => audio.stop();
}

function picture(item: Item): HTMLElement {
  const box = h('div', { class: 'picture', 'aria-hidden': 'true' });
  const emoji = () => h('span', { class: 'emoji' }, item.emoji ?? '⭐');
  if (item.image) {
    const img = h('img', { src: item.image, alt: '', decoding: 'async' });
    img.addEventListener('error', () => img.replaceWith(emoji()), { once: true });
    box.append(img);
  } else {
    box.append(emoji());
  }
  return box;
}
