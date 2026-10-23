# Spec: "What's This?" — Household Word Labels for Kids

## 1. Goal

Help curious young children (roughly 2–6 years old) learn the names and pronunciations of household objects. A parent sticks QR-code labels on objects (refrigerator, gas stove, heater, …). When the code is scanned, the app shows the object's name in big friendly text with a picture, and plays the pronunciation so the child can repeat it.

## 2. Platform decision

**Progressive Web App (static site), installable to the iPhone/iPad home screen.**

Why:
- No App Store, no Xcode, no developer account. Deploys free to GitHub Pages, Netlify, or Cloudflare Pages.
- iOS's built-in Camera app already scans QR codes and opens URLs, so every label works even without the app installed.
- One codebase also works on Android and desktop.

Key iOS constraints the design must respect:
1. **Audio cannot autoplay** on iOS Safari without a user gesture. The item page must show a large "Tap to hear" button. After the first tap in a session, later items may play automatically via the in-app scanner, because the audio context is already unlocked.
2. **Links from the Camera app open in Safari, not in an installed home-screen PWA.** So there are two scan paths (see §4). Both must work.
3. **Camera access requires HTTPS.** Local development uses `vite --host` with a self-signed certificate (e.g. `@vitejs/plugin-basic-ssl`) to test on a real phone.
4. The `BarcodeDetector` API is **not** available in iOS Safari, so in-app scanning uses a JS library (`qr-scanner` by Nimiq, or `jsQR`).

## 3. Users

- **Child (primary)**: can't read yet, maybe can't use the phone alone. Needs huge tap targets, pictures, sound, and nothing to get lost in.
- **Parent (secondary)**: sets up items, prints labels, hands the phone to the child, or scans together.

## 4. Core flows

### 4.1 Scan with the iPhone Camera (zero-install path)
1. Each QR code encodes a URL: `https://<host>/item/<id>`, for example `/item/fridge`. Use path routing, not `#` fragments, so the URLs stay short and the QR codes stay small. The host must serve `index.html` for unknown paths (SPA fallback).
2. The parent or child points the Camera at the label and taps the banner.
3. Safari opens the item page, showing the picture, the word, and a big ▶ button.
4. Tapping ▶ plays the pronunciation. The word highlights while it plays.

### 4.2 Scan inside the app (home-screen path, best for kids)
1. The home screen has one giant "Scan" button (camera icon).
2. A full-screen camera view appears with a friendly frame overlay.
3. When it decodes a URL from this app, it extracts `<id>` and shows the item page **in place**, without navigating away. It also plays the audio automatically if audio is already unlocked.
4. A big "Scan again" button goes back to the camera. QR codes from other sites are ignored, with a gentle "That's not one of our labels" message. The app never opens arbitrary URLs.
5. Plain-text QR codes are also accepted when the text is a known item id (e.g. `fridge`, `Washing machine`), so labels can come from any sticker printer. These work only in the in-app scanner: the iPhone Camera app can't open the app from plain text.

### 4.3 Item page
- Large photo or illustration (emoji fallback if no image).
- Word in very large, rounded, high-contrast type, e.g. **Refrigerator**.
- Optional syllable breakdown under the word: `re · frig · er · a · tor`. During playback, syllables highlight in sequence if timing data exists; otherwise the whole word pulses.
- Buttons, all at least 64×64 pt:
  - ▶ **Hear it**: plays the normal-speed recording.
  - 🐢 **Slowly**: plays the slow recording, or TTS at rate 0.6.
  - 🔁 automatic replay is **not** looped; the child taps again. Repetition is the point.
- A small "Home" button for the parent in a corner.

### 4.4 Browse mode (no scanning needed)
A grid of all items as picture cards, so the parent and child can practice anywhere. Tapping a card opens the item page.

### 4.5 Print labels (parent)
- The `/labels` page (linked from a small parent-only ⚙ menu) renders a printable sheet: each label has a QR code, the word, and the emoji/picture, sized for common sticker paper (default 2" × 2", configurable).
- Use `@media print` CSS so it prints cleanly from Safari or desktop.
- Also provide `npm run labels` to generate `labels.pdf` or PNGs offline (optional, v1.1).

## 5. Pronunciation audio

Support two sources, in priority order:
1. **Recorded audio files** (`/audio/<id>.mp3` and optional `/audio/<id>-slow.mp3`). Best quality, and lets a parent or grandparent record in their own voice or language.
2. **Fallback: Web Speech API** (`speechSynthesis`) using the item's `name` and `lang`. It works offline on iOS. Pick the best available voice for the language; normal rate is 0.9, slow is 0.6.

Audio requirements:
- Preload the current item's audio.
- Unlock audio on the first user tap (play a silent buffer) so in-app scans can auto-play afterward.
- Never overlap: stop current playback before starting new playback.

## 6. Data model

`src/data/items.json`, an array of:

```json
{
  "id": "fridge",
  "name": "Refrigerator",
  "nickname": "Fridge",
  "lang": "en-US",
  "syllables": ["re", "frig", "er", "a", "tor"],
  "emoji": "🧊",
  "image": "/images/fridge.webp",
  "audio": "/audio/fridge.mp3",
  "audioSlow": "/audio/fridge-slow.mp3"
}
```

- `id`: lowercase slug, stable forever, because it is printed on labels.
- `name`, `lang`: required. Everything else is optional, and the UI must degrade gracefully.
- `nickname`: optional shorter everyday word, shown smaller ("also called Fridge") with its own ▶ button.
- `syllableTimes` / `syllableTimesSlow`: optional start times in seconds for each syllable in `audio` / `audioSlow`, e.g. `[0, 0.25, 0.5, 0.7, 0.95]`. They drive syllable highlighting and must be ascending, with one time per syllable.
- `audio`, `audioSlow` and `image` can be filled in automatically: name a file after the item id (`public/audio/<id>.mp3` or `.m4a`, `public/audio/<id>-slow.mp3`, `public/images/<id>.webp`) and run `npm run media`.

Seed items for v1: refrigerator, gas stove, heater, microwave, sink, oven, washing machine, door, window, table, chair, bed, lamp, television, sofa, toilet, bathtub, mirror, clock, fan.

### Multilingual (design for it now, build later)
Keep `lang` per item and keep all UI strings in one `src/i18n.ts` file, so a second language (e.g. a bilingual family) can be added by duplicating items with a different `lang` or adding a `translations` map. Not required for v1.

## 7. Offline & install

- Use `vite-plugin-pwa` for the manifest and service worker.
- Precache the app shell, `items.json`, all images, and all audio, so the whole house works with no network after the first visit.
- Manifest: `display: "standalone"`, portrait orientation, kid-friendly theme color, 180×180 apple-touch-icon.
- Include `<meta name="apple-mobile-web-app-capable">` and status-bar tags for iOS.
- The parent menu shows a one-time "Add to Home Screen" hint for iOS: Share → Add to Home Screen.

## 8. Child-safety & privacy (non-negotiable)

- No accounts, no analytics, no ads, no third-party network calls at runtime. All assets are self-hosted.
- Camera frames are processed on-device only and never stored or sent anywhere.
- No external links reachable from child-facing screens. The parent menu sits behind a simple adult gate (e.g. "press and hold for 2 seconds").
- The scanner only acts on URLs whose origin and path match this app, or on plain text that exactly names a known item id. It never opens anything it scans.

## 9. Design guidelines

- Big, simple, colorful, calm. One primary action per screen.
- Minimum tap target 64 pt, and 96 pt for main actions.
- Font: rounded sans-serif (e.g. "Nunito" self-hosted), word size around 12–16 vw on phones.
- High contrast (WCAG AA). Don't rely on color alone.
- Gentle feedback animations (bounce/pulse). Honor `prefers-reduced-motion`.
- Works in portrait on iPhone SE (375 px wide) up to iPad.
- Respect safe-area insets (`env(safe-area-inset-*)`).

## 10. Tech stack

- **Vite + TypeScript**, vanilla DOM (no framework needed). Preact is acceptable if UI state grows.
- Router: a tiny custom History API router (`/`, `/scan`, `/item/:id`, `/browse`, `/labels`).
- QR decoding: `qr-scanner` (Nimiq).
- QR generation for labels: `qrcode` (npm).
- PWA: `vite-plugin-pwa`.
- Dev HTTPS: `@vitejs/plugin-basic-ssl`.
- Tests: Vitest for logic (routing, URL→id parsing, data validation). Playwright with WebKit for a smoke test of the item page.
- Deploy: GitHub Pages or Netlify (configure SPA fallback, e.g. `404.html` copy or `_redirects`).

## 11. Project structure

```
/
├─ CLAUDE.md
├─ spec.md
├─ index.html
├─ vite.config.ts
├─ public/
│  ├─ audio/        # <id>.mp3, <id>-slow.mp3
│  ├─ images/       # <id>.webp
│  └─ icons/
├─ src/
│  ├─ main.ts
│  ├─ router.ts
│  ├─ audio.ts        # playback, unlock, TTS fallback
│  ├─ scanner.ts      # camera + qr-scanner wrapper
│  ├─ items.ts        # load/validate items.json, lookup by id
│  ├─ i18n.ts
│  ├─ views/          # home.ts, scan.ts, item.ts, browse.ts, labels.ts
│  ├─ styles/
│  └─ data/items.json
├─ scripts/
│  └─ validate-items.ts  # every item has id+name+lang; files referenced exist; ids unique
└─ tests/
```

## 12. Milestones

1. **M1 – Item page**: data loading, `/item/:id` route, display, ▶ with TTS fallback. Testable by typing URLs.
2. **M2 – Labels**: printable `/labels` page with QR codes. Print, stick, and scan with the iPhone Camera end-to-end.
3. **M3 – In-app scanner**: `/scan` with auto-play after unlock and a "Scan again" loop.
4. **M4 – PWA/offline**: manifest, service worker, install hint, offline test.
5. **M5 – Polish**: browse grid, slow mode, syllable highlighting, recorded audio, animations, adult gate.

## 13. Acceptance criteria

- Scanning a printed label with the stock iPhone Camera opens the correct item, and tapping ▶ plays audio within 300 ms.
- From the home-screen app: Scan → item shows and speaks automatically (after the first tap of the session) → Scan again works 20 times in a row without reloading.
- With the phone in airplane mode after one prior visit, all items show and speak.
- An unknown id (`/item/xyz`) shows a friendly "I don't know this one yet" page with a Home button.
- A non-app QR code does nothing harmful and shows a gentle message.
- Lighthouse PWA and Accessibility scores ≥ 90.

## 14. Out of scope (v1)

Speech recognition / grading the child's pronunciation, user accounts, cloud sync, in-app item editor, native App Store build. Possible v2 ideas: a "say it back" mic recording the child can play back (stored locally only), a parent item editor saved to IndexedDB, games ("find the fridge!"), a second language.

## 15. Decisions log

- **M1 (2026-10-09)**
  - Seed item ids (permanent, printed on labels): `fridge`, `stove`, `heater`, `microwave`, `sink`, `oven`, `washing-machine`, `door`, `window`, `table`, `chair`, `bed`, `lamp`, `tv`, `sofa`, `toilet`, `bathtub`, `mirror`, `clock`, `fan`.
  - `items.json` is imported into the JS bundle (not fetched at runtime), so item lookup is synchronous and works offline wherever the app shell does.
  - Font: the system rounded stack (`ui-rounded` = SF Pro Rounded on iOS) for now. A self-hosted Nunito can be added later without changing the layout.
  - Item page: ▶ **Hear it** is the wide primary button. 🐢 **Slowly** is a round 96 pt icon button beside it (aria-label "Slowly"), so both fit above the fold on an iPhone SE. The nickname has its own small ▶ and is always spoken with TTS (there are no nickname audio fields).
  - If a recorded audio file fails to load or play, playback falls back to TTS.
  - Malformed item paths (`/item`, `/item/a/b`) and unknown paths show the same friendly "I don't know this one yet" screen as unknown ids.
  - Home is a placeholder until M3 (Scan button) and M5 (browse grid).
- **M2 (2026-10-09)**
  - Label QR codes encode `VITE_LABEL_ORIGIN + /item/<id>` (a build-time env var, see `.env.example`). If it's unset, they use the origin the page is open at. `/labels` shows the origin it encodes, with a warning for http, localhost, LAN-IP, or `.local` origins. In M3 the in-app scanner must accept the same origin.
  - QR codes use error-correction level M and are drawn as inline SVG on the device. Seed URLs stay at version 4 or below, so they are readable at 1.5″.
  - Label sizes are 1.5″, 2″ (the default), 2.5″, and 3″, and the choice is remembered in `localStorage`. Each label has a checkbox, and unticked labels don't print.
  - The adult gate came forward from M5 because CLAUDE.md requires it for `/labels`: on Home, hold ⚙ for 2 s and a progress ring fills. A plain tap or click never passes it. Typing `/labels` directly is allowed, since a child can't do that.
  - SPA fallback: `public/_redirects` for Netlify and Cloudflare Pages, plus a build-time `404.html` copy for GitHub Pages. GitHub Pages only works from a root (a custom domain or a `<user>.github.io` site), because paths assume `/`.
- **M3 (2026-10-09)**
  - The scanner accepts labels for the origin the app is running on and for `VITE_LABEL_ORIGIN`. Anything else counts as "foreign": the app shows a gentle toast for 2.5 s and keeps scanning. It never navigates.
  - Tapping **Scan** on Home unlocks audio, so later scans speak automatically. Opening `/scan` directly (on reload, or from a bookmark) can't autoplay. Instead, ▶ pulses with a ripple ring that doesn't move the button.
  - The camera stream stays open while an item is showing, and decoded frames are ignored meanwhile. `qr-scanner`'s `pause()` would shut the stream off, and on iOS that can bring the permission prompt back. "Scan again" is instant. For 1.5 s after it, the label that was just shown is ignored, so it doesn't pop straight back. The camera is released when the user leaves `/scan`.
  - Camera errors (permission denied, insecure page, no camera, other) each get a friendly screen with advice for grown-ups, a Home button, and Try again where it helps. `qr-scanner` hides the real `getUserMedia` error, so after a failure the app retries `getUserMedia` once to find the cause.
  - `qr-scanner` and its decoder worker load only on `/scan`, and `qrcode` loads only on `/labels`.
  - The end-to-end scan test runs in Chromium with a fake camera that plays a generated QR video. WebKit has no fake camera.
- **M4 (2026-10-09)**
  - `vite-plugin-pwa` generates the service worker and precaches everything: the app shell, the lazy-loaded scanner, labels page and decoder worker, icons, and any images and audio. Any navigation falls back to the cached `index.html`, so a Camera-opened `/item/<id>` works offline in Safari too. `clientsClaim` makes the very first visit offline-ready without a reload.
  - Updates use `registerType: 'prompt'` without `skipWaiting`. A new version activates only once the app is fully closed, or when a parent taps **Update now** in the parent menu, so it never reloads under a child.
  - Icons are generated from one SVG with `npm run icons` (Playwright renders them) and committed in `public/icons/`: a 180 px apple-touch-icon, 192 px, 512 px, and a maskable 512 px.
  - Parent menu: the ⚙ gate on Home now opens `/parent`, which has Print labels, the one-time iOS "Add to Home Screen" hint (dismissal remembered in `localStorage`), offline status, Update now, and a privacy note.
- **M5 (2026-10-09)**
  - Browse: Home has a smaller secondary **Pictures** button next to the giant Scan button. `/browse` is a grid of picture cards showing each item's `name`. An item opened from the grid shows a ⬅️ "Back to pictures" corner button in place of 🏠, and Back restores the grid's scroll position.
  - Syllable highlighting runs only for recorded audio that has `syllableTimes`. TTS gives no reliable syllable timing, so the whole word pulses instead. Playing the nickname highlights the "also called …" text.
  - Recorded audio: `npm run media` links files by id and warns about files that match no id. `.m4a` is accepted, so iPhone Voice Memos recordings work as-is.
  - Animations: the picture pops in, the word rises in, and grid cards rise in staggered. All are off under `prefers-reduced-motion`.
  - Not done in v1: a self-hosted Nunito font (the system rounded font is used) and a Lighthouse run. Lighthouse 12 also dropped the PWA category, so the "PWA ≥ 90" criterion in §13 is covered by the manifest and offline Playwright tests instead.
- **Plain-text labels (2026-10-23)**
  - Requested so labels can be printed on any sticker printer. The scanner also accepts a QR code whose text is an item id. Matching is case-insensitive and trims surrounding whitespace, and spaces or underscores count as hyphens, so `Washing Machine` matches `washing-machine`.
  - Only known ids match. Item names (`Refrigerator`) don't match, because names aren't promised to stay stable the way ids are. Any other plain text (typos, serial numbers, Wi-Fi codes) is "foreign" and gets the gentle toast, not the "I don't know this one yet" page.
  - Limitation: the stock iPhone Camera app only offers to open URLs, so plain-text stickers need the in-app Scan button (§4.2), not the zero-install path (§4.1).
  - `/labels` shows each item's id on screen (not printed) and a tip explaining what to put in a sticker-printer QR code.
