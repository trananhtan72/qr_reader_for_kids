import { h } from '../dom';
import { t } from '../i18n';
import { items, type Item } from '../items';
import { isLocalOrigin, labelOrigin, labelUrl } from '../origin';
import { qrPath } from '../qr';
import type { Cleanup } from '../router';

const SIZES = [1.5, 2, 2.5, 3]; // inches
const DEFAULT_SIZE = 2;
const SIZE_KEY = 'labelSize';
const SVG_NS = 'http://www.w3.org/2000/svg';

export function render(root: HTMLElement): Cleanup {
  const origin = labelOrigin(import.meta.env.VITE_LABEL_ORIGIN, location.origin);
  const sheet = h('div', { class: 'sheet' });
  const count = h('p', { class: 'muted', 'aria-live': 'polite' });
  const boxes: HTMLInputElement[] = [];

  const updateCount = () => {
    const n = boxes.filter((b) => b.checked).length;
    count.textContent = t.selectedCount(n, boxes.length);
  };

  for (const item of items) {
    const box = h('input', { type: 'checkbox', class: 'no-print', checked: true, 'aria-label': item.name });
    const label = h(
      'label',
      { class: 'label' },
      box,
      qrSvg(labelUrl(origin, item.id)),
      labelWord(item),
      h('code', { class: 'label-id no-print' }, item.id), // plain-text code for sticker printers
    );
    box.addEventListener('change', () => {
      label.classList.toggle('skip', !box.checked);
      updateCount();
    });
    boxes.push(box);
    sheet.append(label);
  }
  updateCount();

  const setAll = (checked: boolean) => {
    for (const b of boxes) {
      b.checked = checked;
      b.dispatchEvent(new Event('change'));
    }
  };

  const size = h(
    'select',
    { id: 'label-size' },
    ...SIZES.map((n) => h('option', { value: String(n) }, t.inches(n))),
  );
  size.value = String(readSize());
  const applySize = () => {
    sheet.style.setProperty('--label-size', `${size.value}in`);
    try {
      localStorage.setItem(SIZE_KEY, size.value);
    } catch {
      // private mode etc. — just don't remember
    }
  };
  size.addEventListener('change', applySize);
  applySize();

  const button = (text: string, cls: string, onClick: () => void) => {
    const b = h('button', { type: 'button', class: `btn ${cls}` }, text);
    b.addEventListener('click', onClick);
    return b;
  };

  root.append(
    h(
      'section',
      { class: 'labels-page' },
      h(
        'header',
        { class: 'controls no-print' },
        h('a', { class: 'btn-corner static', href: '/parent', 'aria-label': t.back }, h('span', { 'aria-hidden': 'true' }, '⬅️')),
        h('h1', { class: 'title' }, t.labelsTitle),
        h('p', {}, `${t.labelsOrigin} `, h('code', { 'data-testid': 'label-origin' }, origin)),
        isLocalOrigin(origin) ? h('p', { class: 'warning', role: 'note' }, '⚠️ ', t.labelsLocalWarning) : null,
        h('div', { class: 'row' }, h('label', { for: 'label-size' }, t.labelSize), size),
        h(
          'div',
          { class: 'row' },
          button(t.selectAll, 'btn-plain', () => setAll(true)),
          button(t.selectNone, 'btn-plain', () => setAll(false)),
        ),
        count,
        button(`🖨️ ${t.print}`, 'btn-primary', () => window.print()),
        h('p', { class: 'muted' }, t.printTip),
        h('p', { class: 'muted' }, t.plainTextTip),
      ),
      sheet,
    ),
  );
  return () => {};
}

function readSize(): number {
  try {
    const n = Number(localStorage.getItem(SIZE_KEY));
    if (SIZES.includes(n)) return n;
  } catch {
    // ignore
  }
  return DEFAULT_SIZE;
}

function qrSvg(text: string): SVGSVGElement {
  const { size, d } = qrPath(text);
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('class', 'qr');
  svg.setAttribute('shape-rendering', 'crispEdges');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', text);
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('width', String(size));
  bg.setAttribute('height', String(size));
  bg.setAttribute('fill', '#fff');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', '#000');
  svg.append(bg, path);
  return svg;
}

function labelWord(item: Item): HTMLElement {
  return h(
    'span',
    { class: 'label-word', lang: item.lang },
    item.emoji ? h('span', { class: 'label-emoji', 'aria-hidden': 'true' }, item.emoji) : null,
    item.name,
  );
}
