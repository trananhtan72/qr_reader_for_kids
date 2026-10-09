import * as audio from '../audio';
import { h } from '../dom';
import { t } from '../i18n';
import { getItem, type Item } from '../items';
import { navState, type Cleanup, type Params } from '../router';
import { activeSyllable, syllableTimesFor } from '../syllables';
import { render as renderNotFound } from './notFound';

export function render(root: HTMLElement, params: Params): Cleanup {
  const item = getItem(params.id ?? '');
  if (!item) return renderNotFound(root);
  return renderItem(root, item);
}

export interface ItemOptions {
  /** Speak right away if audio is already unlocked (in-app scan). Otherwise the ▶ button invites a tap. */
  autoplay?: boolean;
  /** Extra big action under the play buttons, e.g. "Scan again". */
  action?: HTMLElement;
}

export function renderItem(root: HTMLElement, item: Item, opts: ItemOptions = {}): Cleanup {
  audio.preload(item);

  const word = h('h1', { class: 'word', lang: item.lang }, item.name);
  const syllableEls = (item.syllables ?? []).map((s) => h('span', { class: 'syl' }, s));
  const syllables =
    syllableEls.length > 1
      ? h('p', { class: 'syllables', 'aria-hidden': 'true' }, ...syllableEls.flatMap((el, i) => (i ? [' · ', el] : [el])))
      : null;
  const nicknameText = item.nickname ? h('span', { lang: item.lang }, t.alsoCalled(item.nickname)) : null;
  const buttons: HTMLButtonElement[] = [];

  function clearHighlight() {
    word.classList.remove('speaking');
    nicknameText?.classList.remove('speaking');
    syllableEls.forEach((el) => el.classList.remove('on'));
    buttons.forEach((b) => b.classList.remove('active'));
  }

  function playWith(playOpts: audio.PlayOptions, button: HTMLButtonElement) {
    audio.unlock(); // we're inside the tap gesture
    clearHighlight();
    const speed = playOpts.speed ?? 'normal';
    let times: number[] | undefined;
    audio.play(item, {
      ...playOpts,
      onStart: (source) => {
        clearHighlight();
        button.classList.add('active');
        if (playOpts.word === 'nickname') return nicknameText?.classList.add('speaking');
        // Recorded audio with timing data: light up syllables in sequence. Otherwise the whole word pulses.
        times = source.kind === 'file' ? syllableTimesFor(item, speed) : undefined;
        if (!times) word.classList.add('speaking');
      },
      onProgress: (seconds) => {
        if (!times) return;
        const active = activeSyllable(times, seconds);
        syllableEls.forEach((el, i) => el.classList.toggle('on', i === active));
      },
      onEnd: clearHighlight,
    });
  }

  function button(cls: string, icon: string, label: string, playOpts: audio.PlayOptions, ariaLabel?: string) {
    const b = h(
      'button',
      { type: 'button', class: `btn ${cls}`, 'aria-label': ariaLabel },
      h('span', { class: 'icon', 'aria-hidden': 'true' }, icon),
      label,
    );
    b.addEventListener('click', () => {
      hear.classList.remove('invite');
      playWith(playOpts, b);
    });
    buttons.push(b);
    return b;
  }

  const hear = button('btn-primary', '▶', t.hearIt, { speed: 'normal' });

  root.append(
    h(
      'section',
      { class: opts.action ? 'screen item has-action' : 'screen item', 'data-testid': 'item' },
      cornerButton(),
      picture(item),
      word,
      syllables,
      nicknameText
        ? h(
            'p',
            { class: 'nickname' },
            nicknameText,
            button('btn-small', '▶', '', { word: 'nickname' }, t.hearNickname(item.nickname!)),
          )
        : null,
      h(
        'div',
        { class: 'actions' },
        hear,
        button('btn-secondary btn-round', '🐢', '', { speed: 'slow' }, t.slowly),
      ),
      opts.action,
    ),
  );

  if (opts.autoplay && audio.isUnlocked()) playWith({ speed: 'normal' }, hear);
  else hear.classList.add('invite'); // iOS: no sound until a tap, so make the tap obvious

  return () => audio.stop();
}

/** Opened from the picture grid: go back to it (keeping the scroll spot). Otherwise: Home. */
function cornerButton(): HTMLElement {
  if (!navState().fromBrowse) {
    return h('a', { class: 'btn-corner', href: '/', 'aria-label': t.home }, h('span', { 'aria-hidden': 'true' }, '🏠'));
  }
  const back = h(
    'button',
    { type: 'button', class: 'btn-corner', 'aria-label': t.backToPictures },
    h('span', { 'aria-hidden': 'true' }, '⬅️'),
  );
  back.addEventListener('click', () => history.back());
  return back;
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
