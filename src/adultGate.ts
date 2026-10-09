export const HOLD_MS = 2000;

/**
 * Press-and-hold gate for parent features. Calls `onPass` only after the pointer stays
 * down on `target` for `holdMs`. Releasing, leaving, or cancelling resets it.
 * Toggles the `holding` class so CSS can show progress. Returns a detach function.
 */
export function attachAdultGate(
  target: HTMLElement,
  onPass: () => void,
  holdMs = HOLD_MS,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    target.classList.remove('holding');
  };
  const start = (e: Event) => {
    e.preventDefault(); // no text selection / iOS callout while holding
    cancel();
    target.classList.add('holding');
    timer = setTimeout(() => {
      cancel();
      onPass();
    }, holdMs);
  };
  const block = (e: Event) => e.preventDefault();

  const listeners: [string, (e: Event) => void][] = [
    ['pointerdown', start],
    ['pointerup', cancel],
    ['pointerleave', cancel],
    ['pointercancel', cancel],
    ['contextmenu', block],
    ['click', block], // a plain tap must never pass the gate
  ];
  for (const [type, fn] of listeners) target.addEventListener(type, fn);
  return () => {
    cancel();
    for (const [type, fn] of listeners) target.removeEventListener(type, fn);
  };
}
