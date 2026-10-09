import { h } from '../dom';
import { t } from '../i18n';
import type { Cleanup } from '../router';

export function render(root: HTMLElement): Cleanup {
  root.append(
    h(
      'section',
      { class: 'screen center', 'data-testid': 'not-found' },
      h('div', { class: 'picture', 'aria-hidden': 'true' }, h('span', { class: 'emoji' }, '🤔')),
      h('h1', { class: 'title' }, t.unknownTitle),
      h('p', { class: 'hint' }, t.unknownBody),
      h('a', { class: 'btn btn-primary', href: '/' }, h('span', { 'aria-hidden': 'true' }, '🏠'), t.home),
    ),
  );
  return () => {};
}
