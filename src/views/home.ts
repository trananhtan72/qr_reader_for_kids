import { attachAdultGate } from '../adultGate';
import * as audio from '../audio';
import { h } from '../dom';
import { t } from '../i18n';
import { navigate, type Cleanup } from '../router';

export function render(root: HTMLElement): Cleanup {
  const gear = h(
    'button',
    { type: 'button', class: 'btn-corner right gate', 'aria-label': t.parentGate, title: t.parentGate },
    h('span', { 'aria-hidden': 'true' }, '⚙️'),
  );
  const detach = attachAdultGate(gear, () => navigate('/parent'));

  const scan = h(
    'a',
    { class: 'btn btn-primary btn-hero', href: '/scan', 'data-testid': 'scan-button' },
    h('span', { class: 'icon', 'aria-hidden': 'true' }, '📷'),
    t.scan,
  );
  // This tap is our user gesture: unlock audio now so scanned items can speak by themselves.
  scan.addEventListener('click', () => audio.unlock());

  const browse = h(
    'a',
    { class: 'btn btn-secondary', href: '/browse' },
    h('span', { class: 'icon', 'aria-hidden': 'true' }, '🖼️'),
    t.browse,
  );
  browse.addEventListener('click', () => audio.unlock());

  root.append(
    h(
      'section',
      { class: 'screen center' },
      gear,
      h('h1', { class: 'title' }, h('span', { 'aria-hidden': 'true' }, '👋 '), t.appName),
      scan,
      h('p', { class: 'hint' }, t.homeHint),
      browse,
    ),
  );
  return detach;
}
