import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachAdultGate } from '../../src/adultGate';

/** Just enough of an HTMLElement for the gate (no DOM in this test env). */
function fakeElement() {
  const el = new EventTarget() as EventTarget & { classList: { add: () => void; remove: () => void } };
  el.classList = { add: vi.fn(), remove: vi.fn() };
  return el as unknown as HTMLElement;
}
const fire = (el: HTMLElement, type: string) => el.dispatchEvent(new Event(type, { cancelable: true }));

describe('attachAdultGate', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('passes only after holding for the full duration', () => {
    const el = fakeElement();
    const pass = vi.fn();
    attachAdultGate(el, pass, 2000);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(1999);
    expect(pass).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(pass).toHaveBeenCalledOnce();
  });

  it.each(['pointerup', 'pointerleave', 'pointercancel'])('resets on %s', (type) => {
    const el = fakeElement();
    const pass = vi.fn();
    attachAdultGate(el, pass, 2000);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(1500);
    fire(el, type);
    vi.advanceTimersByTime(5000);
    expect(pass).not.toHaveBeenCalled();
  });

  it('ignores plain clicks (e.g. keyboard/assistive activation)', () => {
    const el = fakeElement();
    const pass = vi.fn();
    attachAdultGate(el, pass, 2000);
    expect(fire(el, 'click')).toBe(false); // default prevented
    vi.advanceTimersByTime(5000);
    expect(pass).not.toHaveBeenCalled();
  });

  it('detach stops a hold in progress', () => {
    const el = fakeElement();
    const pass = vi.fn();
    const detach = attachAdultGate(el, pass, 2000);
    fire(el, 'pointerdown');
    detach();
    vi.advanceTimersByTime(5000);
    fire(el, 'pointerdown');
    vi.advanceTimersByTime(5000);
    expect(pass).not.toHaveBeenCalled();
  });
});
