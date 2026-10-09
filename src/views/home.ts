import { h } from '../dom';
import { t } from '../i18n';
import type { Cleanup } from '../router';

// Placeholder until M3 (Scan button) and M5 (browse grid).
export function render(root: HTMLElement): Cleanup {
  root.append(
    h(
      'section',
      { class: 'screen center' },
      h('div', { class: 'picture', 'aria-hidden': 'true' }, h('span', { class: 'emoji' }, '👋')),
      h('h1', { class: 'title' }, t.appName),
      h('p', { class: 'hint' }, t.homeHint),
    ),
  );
  return () => {};
}
