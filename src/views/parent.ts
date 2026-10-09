import { h } from '../dom';
import { t } from '../i18n';
import { isIos, isStandalone } from '../platform';
import { applyUpdate, hasUpdate, isOfflineReady, onPwaChange } from '../pwa';
import type { Cleanup } from '../router';

const INSTALL_HINT_KEY = 'installHintSeen';

/** Parent menu, reached only through the press-and-hold gate on Home. */
export function render(root: HTMLElement): Cleanup {
  const status = h('p', { class: 'status', 'data-testid': 'offline-status', role: 'status' });
  const updateBox = h('div', { class: 'card', hidden: true });

  function refresh() {
    if (!('serviceWorker' in navigator)) status.textContent = `⚠️ ${t.offlineUnsupported}`;
    else if (isOfflineReady()) status.textContent = `✅ ${t.offlineReady}`;
    else status.textContent = `⏳ ${t.offlinePending}`;
    updateBox.hidden = !hasUpdate();
  }
  const update = h('button', { type: 'button', class: 'btn btn-plain' }, `🔄 ${t.updateNow}`);
  update.addEventListener('click', applyUpdate);
  updateBox.append(h('p', {}, t.updateAvailable), update);

  root.append(
    h(
      'section',
      { class: 'parent-page' },
      h('a', { class: 'btn-corner static', href: '/', 'aria-label': t.home }, h('span', { 'aria-hidden': 'true' }, '🏠')),
      h('h1', { class: 'title' }, t.parentTitle),
      h('a', { class: 'btn btn-primary', href: '/labels' }, h('span', { class: 'icon', 'aria-hidden': 'true' }, '🖨️'), t.printLabels),
      installHint(),
      status,
      updateBox,
      h('p', { class: 'muted' }, t.privacy),
    ),
  );

  refresh();
  const off = onPwaChange(refresh);
  // `controller` appears once the first install finishes; re-check then.
  navigator.serviceWorker?.addEventListener('controllerchange', refresh);
  return () => {
    off();
    navigator.serviceWorker?.removeEventListener('controllerchange', refresh);
  };
}

/** One-time iOS hint: Safari has no install prompt, so explain Share → Add to Home Screen. */
function installHint(): HTMLElement | null {
  if (!isIos() || isStandalone() || readFlag(INSTALL_HINT_KEY)) return null;
  const done = h('button', { type: 'button', class: 'btn btn-plain' }, t.installDone);
  const card = h(
    'div',
    { class: 'card', 'data-testid': 'install-hint' },
    h('h2', {}, '📲 ', t.installTitle),
    h('p', {}, t.installBody),
    done,
  );
  done.addEventListener('click', () => {
    writeFlag(INSTALL_HINT_KEY);
    card.remove();
  });
  return card;
}

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
function writeFlag(key: string): void {
  try {
    localStorage.setItem(key, '1');
  } catch {
    // private mode: the hint just shows again next time
  }
}
