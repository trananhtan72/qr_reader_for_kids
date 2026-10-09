import { attachAdultGate } from '../adultGate';
import { h } from '../dom';
import { t } from '../i18n';
import { navigate, type Cleanup } from '../router';

// Scan button arrives in M3, browse grid in M5.
export function render(root: HTMLElement): Cleanup {
  const gear = h(
    'button',
    { type: 'button', class: 'btn-corner right gate', 'aria-label': t.parentGate, title: t.parentGate },
    h('span', { 'aria-hidden': 'true' }, '⚙️'),
  );
  const detach = attachAdultGate(gear, () => navigate('/labels'));

  root.append(
    h(
      'section',
      { class: 'screen center' },
      gear,
      h('div', { class: 'picture', 'aria-hidden': 'true' }, h('span', { class: 'emoji' }, '👋')),
      h('h1', { class: 'title' }, t.appName),
      h('p', { class: 'hint' }, t.homeHint),
    ),
  );
  return detach;
}
