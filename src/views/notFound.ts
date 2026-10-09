import { h } from '../dom';
import { t } from '../i18n';
import type { Cleanup } from '../router';

/** Friendly "I don't know this one yet". `action` replaces the big Home button (Home moves to the corner). */
export function render(root: HTMLElement): Cleanup {
  return renderUnknown(root);
}

export function renderUnknown(root: HTMLElement, action?: HTMLElement): Cleanup {
  const home = (cls: string) =>
    h('a', { class: cls, href: '/', 'aria-label': action ? t.home : undefined }, h('span', { 'aria-hidden': 'true' }, '🏠'), action ? null : t.home);
  root.append(
    h(
      'section',
      { class: 'screen center', 'data-testid': 'not-found' },
      action ? home('btn-corner') : null,
      h('div', { class: 'picture', 'aria-hidden': 'true' }, h('span', { class: 'emoji' }, '🤔')),
      h('h1', { class: 'title' }, t.unknownTitle),
      h('p', { class: 'hint' }, t.unknownBody),
      action ?? home('btn btn-primary'),
    ),
  );
  return () => {};
}
