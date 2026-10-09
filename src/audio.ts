import type { Item } from './items';

export type Speed = 'normal' | 'slow';
export type Word = 'name' | 'nickname';

export type Source =
  | { kind: 'file'; src: string }
  | { kind: 'tts'; text: string; lang: string; rate: number };

export const TTS_RATE: Record<Speed, number> = { normal: 0.9, slow: 0.6 };

/** Pure: decide what to play. Recorded files win; otherwise speech synthesis. */
export function chooseSource(item: Item, speed: Speed, word: Word = 'name'): Source {
  if (word === 'name') {
    const file = speed === 'slow' ? item.audioSlow : item.audio;
    if (file) return { kind: 'file', src: file };
  }
  const text = word === 'nickname' && item.nickname ? item.nickname : item.name;
  return { kind: 'tts', text, lang: item.lang, rate: TTS_RATE[speed] };
}

type VoiceLike = Pick<SpeechSynthesisVoice, 'lang' | 'localService' | 'default'>;

/** Pure: best voice for a BCP 47 tag. Exact match > same language; on-device > network; default first. */
export function pickVoice<V extends VoiceLike>(voices: readonly V[], lang: string): V | undefined {
  const want = lang.toLowerCase().replace('_', '-');
  const base = want.split('-')[0];
  const norm = (v: V) => v.lang.toLowerCase().replace('_', '-');
  const score = (v: V) =>
    (norm(v) === want ? 4 : 0) + (v.localService ? 2 : 0) + (v.default ? 1 : 0);
  const candidates = voices.filter((v) => norm(v).split('-')[0] === base);
  return candidates.sort((a, b) => score(b) - score(a))[0];
}

// ---- Runtime (browser) side ----

const synth: SpeechSynthesis | undefined =
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined;

let player: HTMLAudioElement | undefined;
let unlocked = false;
let token = 0; // bumps on every play/stop so stale callbacks are ignored
let currentUtterance: SpeechSynthesisUtterance | undefined; // keep a ref: some engines GC it mid-speech
let voices: SpeechSynthesisVoice[] = [];
let voicesReady: Promise<void> | undefined;

function getPlayer(): HTMLAudioElement {
  if (!player) {
    player = new Audio();
    player.preload = 'auto';
  }
  return player;
}

/** iOS loads voices asynchronously; wait for `voiceschanged`, but never more than `timeoutMs`. */
function loadVoices(timeoutMs = 1000): Promise<void> {
  if (!synth) return Promise.resolve();
  voicesReady ??= new Promise<void>((resolve) => {
    const done = () => {
      voices = synth.getVoices();
      resolve();
    };
    if (synth.getVoices().length > 0) return done();
    synth.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, timeoutMs);
  });
  return voicesReady;
}
loadVoices();

/** A 1-sample silent WAV, built locally (no network). */
function silentWavUrl(): string {
  const buf = new ArrayBuffer(46);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); v.setUint32(4, 38, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, 2, true); v.setInt16(44, 0, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

export function isUnlocked(): boolean {
  return unlocked;
}

/** Call synchronously inside a user gesture (tap). Safe to call repeatedly. */
export function unlock(): void {
  if (unlocked) return;
  unlocked = true;
  const p = getPlayer();
  p.src = silentWavUrl();
  p.play().catch(() => {});
  if (synth) synth.speak(new SpeechSynthesisUtterance(''));
}

export function stop(): void {
  token++;
  if (player) {
    player.pause();
    player.onended = player.onerror = null;
  }
  if (currentUtterance) currentUtterance.onend = currentUtterance.onerror = null;
  currentUtterance = undefined;
  synth?.cancel();
}

/** Warm the cache for the item's recorded audio, if any. */
export function preload(item: Item): void {
  const src = item.audio;
  if (!src) return;
  const p = getPlayer();
  if (!p.src.endsWith(src) && p.paused) {
    p.src = src;
    p.load();
  }
}

export interface PlayOptions {
  speed?: Speed;
  word?: Word;
  onStart?: () => void;
  onEnd?: () => void;
}

/** Plays the item's pronunciation. Stops anything already playing. Never throws. */
export function play(item: Item, opts: PlayOptions = {}): void {
  stop();
  const my = ++token;
  const speed = opts.speed ?? 'normal';
  const word = opts.word ?? 'name';
  let ended = false;
  const end = () => {
    if (ended || my !== token) return;
    ended = true;
    opts.onEnd?.();
  };
  const source = chooseSource(item, speed, word);
  opts.onStart?.();
  if (source.kind === 'file') {
    playFile(source.src, my, end, () => {
      // Missing/undecodable file: fall back to speech.
      if (my !== token) return;
      const tts = chooseSource({ ...item, audio: undefined, audioSlow: undefined }, speed, word);
      if (tts.kind === 'tts') speak(tts, my, end);
    });
  } else {
    speak(source, my, end);
  }
}

function playFile(src: string, my: number, end: () => void, fail: () => void) {
  const p = getPlayer();
  if (!p.src.endsWith(src)) p.src = src;
  p.currentTime = 0;
  p.onended = end;
  p.onerror = fail;
  p.play().catch(() => {
    if (my === token) fail();
  });
}

function speak(source: Extract<Source, { kind: 'tts' }>, my: number, end: () => void) {
  if (!synth) return end();
  const go = () => {
    if (my !== token) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(source.text);
    u.lang = source.lang;
    u.rate = source.rate;
    const voice = pickVoice(voices, source.lang);
    if (voice) u.voice = voice;
    u.onend = end;
    u.onerror = end;
    currentUtterance = u;
    synth.speak(u);
    // iOS occasionally never fires onend; don't leave the UI stuck "speaking".
    setTimeout(end, 2000 + (source.text.length * 250) / source.rate);
  };
  // Speak synchronously when voices are ready so we stay inside the tap gesture.
  if (voices.length > 0 || !voicesReady) go();
  else loadVoices().then(go);
}
