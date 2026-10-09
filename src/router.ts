import { ID_PATTERN } from './items';

export type Cleanup = () => void;
export type Params = Record<string, string>;
export type View = (root: HTMLElement, params: Params) => Cleanup;

export type RouteName = 'home' | 'item' | 'notFound';
export interface RouteMatch {
  name: RouteName;
  params: Params;
}

const ITEM_PATH = /^\/item\/([^/]+)\/?$/;

/** Pure path → route matching. Unknown paths map to notFound. */
export function matchRoute(pathname: string): RouteMatch {
  if (pathname === '/' || pathname === '' || pathname === '/index.html') return { name: 'home', params: {} };
  const m = ITEM_PATH.exec(pathname);
  if (m) {
    let id: string;
    try {
      id = decodeURIComponent(m[1]);
    } catch {
      return { name: 'notFound', params: {} };
    }
    // Unknown-but-well-formed ids still go to the item view, which shows "I don't know this one yet".
    return { name: 'item', params: { id } };
  }
  return { name: 'notFound', params: {} };
}

/**
 * Extracts an item id from a scanned QR payload, or null if it is not one of our labels.
 * Only URLs on `origin` with the exact `/item/<id>` shape are accepted.
 */
export function itemIdFromUrl(text: string, origin: string): string | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  const m = ITEM_PATH.exec(url.pathname);
  if (!m || !ID_PATTERN.test(m[1])) return null;
  return m[1];
}

export function createRouter(root: HTMLElement, views: Record<RouteName, View>) {
  let cleanup: Cleanup | null = null;

  function render() {
    cleanup?.();
    root.replaceChildren();
    const { name, params } = matchRoute(location.pathname);
    cleanup = views[name](root, params);
    window.scrollTo(0, 0);
  }

  function navigate(path: string) {
    if (path === location.pathname) return;
    history.pushState(null, '', path);
    render();
  }

  // Intercept same-origin links so navigation stays in-app (no reload, audio stays unlocked).
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest('a');
    if (!a || a.target || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    e.preventDefault();
    navigate(url.pathname);
  });
  window.addEventListener('popstate', render);

  return { start: render, navigate };
}
