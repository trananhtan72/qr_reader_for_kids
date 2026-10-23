# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

A mobile-first PWA that helps young children learn household object names. QR labels on objects encode `https://<host>/item/<id>`. Scanning a label shows a picture and the word, and plays its pronunciation. **`spec.md` is the source of truth**: read it before starting any milestone, and update it when a decision changes.

## Commands

- `npm install`
- `npm run dev` — Vite dev server with HTTPS on the LAN (`--host`), so a real iPhone can test the camera
- `npm run build` — type-check, validate items, then build
- `npm run preview` — serve the production build
- `npm test` — Vitest unit tests
- `npm run test:e2e` — Playwright (WebKit) smoke tests
- `npm run validate` — runs `scripts/validate-items.ts`
- `npm run media` — link `public/audio/<id>.mp3|m4a` and `public/images/<id>.webp` into `items.json`, then validate
- `npm run icons` — regenerate `public/icons/*.png` from the SVG in `scripts/make-icons.ts`

If a script doesn't exist yet when you need it, add it to `package.json`.

## Stack & conventions

- Vite + TypeScript (`strict: true`) with vanilla DOM. Don't add a UI framework without asking. Keep dependencies minimal.
- Allowed runtime deps: `qr-scanner`, `qrcode`. Dev deps: `vite-plugin-pwa`, `@vitejs/plugin-basic-ssl`, `vitest`, `@playwright/test`, `tsx`. Ask before adding anything else.
- Small modules with one responsibility (`audio.ts`, `scanner.ts`, `router.ts`, `items.ts`). Each view in `src/views/` exports `render(root, params)` and returns a cleanup function, which must stop the camera and audio.
- Routing uses the History API with paths, not hashes. The deploy target needs an SPA fallback.
- All user-facing strings go in `src/i18n.ts`.
- CSS: plain CSS with custom properties in `src/styles/`. Mobile-first, `env(safe-area-inset-*)`, honor `prefers-reduced-motion`.
- Item data lives only in `src/data/items.json`. Never hard-code item names in views.

## Hard rules (child safety & privacy)

- No analytics, tracking, ads, accounts, or third-party network requests at runtime. Self-host fonts, images, and audio. No CDN links.
- Camera frames stay on-device. Never upload, store, or log them.
- The scanner acts only on URLs matching this app's origin and the `/item/<id>` pattern, or on plain text that is exactly a known item id (case, spaces, and `_` are forgiven; used for sticker-printer labels). Never `window.open` or navigate to scanned external URLs.
- No external links on child-facing screens. Parent features (`/labels`, settings) sit behind the press-and-hold adult gate.
- Item `id`s are printed on physical labels. **Never rename or remove an existing id.** Add new ones instead.

## iOS gotchas — always account for these

1. Audio needs a user gesture. Unlock it on the first tap (`audio.unlock()`); until then, show a big "Tap to hear" button instead of autoplaying.
2. Camera Mode QR links open in Safari, not the installed PWA. Both paths must work (spec §4).
3. `getUserMedia` requires HTTPS and needs `playsinline` + `muted` on the `<video>` element. Stop all tracks on view cleanup.
4. `BarcodeDetector` doesn't exist on iOS Safari, so use `qr-scanner`.
5. `speechSynthesis` voices load asynchronously; wait for `voiceschanged` (with a timeout) before choosing a voice. Call `speechSynthesis.cancel()` before speaking.
6. Test layouts at 375 px wide (iPhone SE) and on iPad.

## Audio behavior

Prefer `item.audio` / `item.audioSlow` files. Fall back to `speechSynthesis` with `item.lang` (rate 0.9 normal, 0.6 slow). Never let two sounds overlap. Missing optional fields must not throw; degrade gracefully.

## UI principles

The child can't read. Use one primary action per screen, tap targets ≥ 64 pt (≥ 96 pt for main actions), large rounded type, pictures and emoji, and gentle animation. Error states are friendly and always offer a big Home button.

## Workflow

- Work milestone by milestone (spec §12). At the start of each one, briefly restate the plan. At the end, run `npm run build && npm test` and summarize what to test on a real iPhone.
- Write unit tests for pure logic: URL→id parsing, item validation, router matching, audio source selection.
- Keep commits small and descriptive.
- When unsure about a product decision, ask rather than guess, and record the answer in `spec.md`.
