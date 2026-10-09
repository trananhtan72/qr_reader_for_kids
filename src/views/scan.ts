import { h } from '../dom';
import { t } from '../i18n';
import type { Cleanup } from '../router';
import { appOrigins, cameraErrorKind, classifyScan, createScanner, type CameraError, type Scanner } from '../scanner';
import { renderItem } from './item';
import { renderUnknown } from './notFound';

const TOAST_MS = 2500;
/** After "Scan again", ignore the label we just showed for a moment so it doesn't pop straight back. */
const SAME_LABEL_GRACE_MS = 1500;

export function render(root: HTMLElement): Cleanup {
  const origins = appOrigins(import.meta.env.VITE_LABEL_ORIGIN, location.origin);

  const video = h('video', { class: 'camera', 'aria-hidden': 'true' });
  const status = h('p', { class: 'scan-status', role: 'status' }, t.cameraStarting);
  const toast = h('p', { class: 'toast', role: 'alert', hidden: true }, '🙂 ', t.notOurLabel);
  const camera = h(
    'section',
    { class: 'scan', 'data-state': 'starting', 'data-testid': 'scan' },
    video,
    h('div', { class: 'frame', 'aria-hidden': 'true' }),
    h('a', { class: 'btn-corner', href: '/', 'aria-label': t.home }, h('span', { 'aria-hidden': 'true' }, '🏠')),
    status,
    toast,
  );
  const result = h('div', { class: 'scan-result', hidden: true });
  root.append(camera, result);

  let scanner: Scanner | undefined;
  let showing = false; // an item (or "unknown") is on screen; ignore frames
  let resultCleanup: Cleanup | undefined;
  let lastShown = '';
  let lastShownAt = 0;
  let toastText = '';
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  function onText(text: string) {
    if (showing || disposed) return;
    if (text === lastShown && Date.now() - lastShownAt < SAME_LABEL_GRACE_MS) return;
    const outcome = classifyScan(text, origins);
    if (outcome.kind === 'foreign') return showToast(text);

    hideToast();
    showing = true;
    lastShown = text;
    camera.hidden = true;
    result.hidden = false;
    const again = h(
      'button',
      { type: 'button', class: 'btn btn-scan' },
      h('span', { class: 'icon', 'aria-hidden': 'true' }, '📷'),
      t.scanAgain,
    );
    again.addEventListener('click', scanAgain);
    resultCleanup =
      outcome.kind === 'item'
        ? renderItem(result, outcome.item, { autoplay: true, action: again })
        : renderUnknown(result, again);
    window.scrollTo(0, 0);
  }

  function scanAgain() {
    resultCleanup?.(); // stops audio
    resultCleanup = undefined;
    result.replaceChildren();
    result.hidden = true;
    camera.hidden = false;
    lastShownAt = Date.now();
    showing = false;
  }

  function showToast(text: string) {
    // Keep showing (not re-announcing) while the same code stays in view.
    if (text === toastText && !toast.hidden) {
      armToastTimer();
      return;
    }
    toastText = text;
    toast.hidden = false;
    armToastTimer();
  }
  function armToastTimer() {
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, TOAST_MS);
  }
  function hideToast() {
    clearTimeout(toastTimer);
    toast.hidden = true;
    toastText = '';
  }

  async function startCamera() {
    camera.dataset.state = 'starting';
    status.textContent = t.cameraStarting;
    scanner?.destroy();
    scanner = createScanner(video, onText);
    try {
      await scanner.start();
      if (disposed) return;
      camera.dataset.state = 'scanning';
      status.textContent = t.scanHint;
    } catch (err) {
      if (disposed) return;
      scanner.destroy();
      scanner = undefined;
      showCameraError(cameraErrorKind(err));
    }
  }

  function showCameraError(kind: CameraError) {
    camera.hidden = true;
    result.hidden = false;
    const [title, body] = {
      denied: [t.cameraDeniedTitle, t.cameraDeniedBody],
      insecure: [t.cameraInsecureTitle, t.cameraInsecureBody],
      'no-camera': [t.noCameraTitle, t.noCameraBody],
      other: [t.cameraOtherTitle, t.cameraOtherBody],
    }[kind];
    const retry = h(
      'button',
      { type: 'button', class: 'btn btn-scan' },
      h('span', { class: 'icon', 'aria-hidden': 'true' }, '🔄'),
      t.tryAgain,
    );
    retry.addEventListener('click', () => {
      result.replaceChildren();
      result.hidden = true;
      camera.hidden = false;
      startCamera();
    });
    result.replaceChildren(
      h(
        'section',
        { class: 'screen center', 'data-testid': 'camera-error', 'data-kind': kind },
        h('a', { class: 'btn-corner', href: '/', 'aria-label': t.home }, h('span', { 'aria-hidden': 'true' }, '🏠')),
        h('div', { class: 'picture', 'aria-hidden': 'true' }, h('span', { class: 'emoji' }, '🙈')),
        h('h1', { class: 'title' }, title),
        h('p', { class: 'hint parent' }, body),
        kind === 'insecure' || kind === 'no-camera' ? h('a', { class: 'btn btn-primary', href: '/' }, t.home) : retry,
      ),
    );
  }

  startCamera();

  return () => {
    disposed = true;
    clearTimeout(toastTimer);
    resultCleanup?.();
    scanner?.destroy();
  };
}
