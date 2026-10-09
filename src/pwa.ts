// Service worker registration + small bits of install/offline state for the parent menu.
import { registerSW } from 'virtual:pwa-register';

type Listener = () => void;
const listeners = new Set<Listener>();
let needRefresh = false;
let offlineReady = false;
let update: ((reload?: boolean) => Promise<void>) | undefined;

export function startPwa(): void {
  if (!('serviceWorker' in navigator)) return;
  update = registerSW({
    immediate: true,
    onNeedRefresh() {
      needRefresh = true;
      listeners.forEach((l) => l());
    },
    onOfflineReady() {
      offlineReady = true;
      listeners.forEach((l) => l());
    },
  });
}

/** True once a service worker controls the page (i.e. everything is cached). */
export function isOfflineReady(): boolean {
  return offlineReady || !!navigator.serviceWorker?.controller;
}

export function hasUpdate(): boolean {
  return needRefresh;
}

/** Activates the waiting version and reloads. Parent-initiated only. */
export function applyUpdate(): void {
  void update?.(true);
}

export function onPwaChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
