// Geluid: vertelstem, achtergrondmuziek, geluidseffecten en gesynthetiseerde
// UI-geluiden (Web Audio). Mobiele browsers laten pas geluid toe na een tik,
// dus unlock() moet vanuit een klik/tik aangeroepen worden. Daarna hergebruiken
// we steeds dezelfde audio-elementen (dat is wat iOS vereist).
import { store } from './store.js';

let ctx = null;
let master = null;
let musicGain = null;
let unlocked = false;

export const narration = new Audio();
export const music = new Audio();
export const sfx = new Audio();
narration.preload = 'auto';
music.loop = true;
music.preload = 'auto';

const MUSIC_VOLUME = 0.28;
const MUSIC_DUCKED = 0.12;
let musicTarget = MUSIC_VOLUME;
let musicSrc = null;

export const isUnlocked = () => unlocked;
export const isMuted = () => store.setting('muted', false);

function silentWav() {
  // 0,05 s stilte als WAV-blob, om audio-elementen te 'ontgrendelen'.
  const rate = 8000, n = 400;
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

/** Oproepen vanuit een tik/klik. Veilig om meermaals te doen. */
export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        ctx = new AC();
        master = ctx.createGain();
        master.connect(ctx.destination);
        // Muziek via een gain-node: op iOS kan HTMLAudio.volume niet aangepast worden.
        try {
          const src = ctx.createMediaElementSource(music);
          musicGain = ctx.createGain();
          musicGain.gain.value = MUSIC_VOLUME;
          src.connect(musicGain).connect(master);
          music.volume = 1;
        } catch (e) { musicGain = null; }
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  } catch (e) { /* geen Web Audio */ }

  if (!unlocked) {
    const silent = silentWav();
    for (const el of [narration, sfx]) {
      if (el.src) continue;
      el.src = silent;
      const p = el.play();
      if (p) p.then(() => el.pause()).catch(() => {});
    }
    if (!music.src) {
      music.src = silent;
      const p = music.play();
      if (p) p.then(() => { if (music.src === silent) music.pause(); }).catch(() => {});
    }
    unlocked = true;
  }
  applyMute();
}

export function applyMute() {
  const m = isMuted();
  narration.muted = m;
  sfx.muted = m;
  music.muted = m;
  if (master) master.gain.value = m ? 0 : 1;
}

export function setMuted(m) {
  store.setSetting('muted', m);
  applyMute();
}

// ---------- Muziek ----------

function setMusicVolume(v, time = 0.6) {
  musicTarget = v;
  if (musicGain && ctx) {
    const g = musicGain.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(v, ctx.currentTime + time);
  } else {
    music.volume = Math.min(1, v);
  }
}

/** Start (of wissel naar) een muziekstuk. Ontbrekende bestanden worden stil genegeerd. */
export function playMusic(url) {
  if (!url) { stopMusic(); return; }
  if (musicSrc === url && !music.paused) return;
  musicSrc = url;
  music.src = url;
  music.currentTime = 0;
  music.onerror = () => { if (musicSrc === url) musicSrc = null; };
  setMusicVolume(musicTarget, 0.01);
  const p = music.play();
  if (p) p.catch(() => {});
}
export function pauseMusic() { music.pause(); }
export function resumeMusic() { if (musicSrc) { const p = music.play(); if (p) p.catch(() => {}); } }
export function stopMusic() {
  musicSrc = null;
  music.pause();
}
export function duckMusic(on) { setMusicVolume(on ? MUSIC_DUCKED : MUSIC_VOLUME); }

// ---------- Geluidseffecten ----------

export function playSfx(url, volume = 1) {
  if (!url) return;
  sfx.src = url;
  sfx.volume = Math.max(0, Math.min(1, volume));
  sfx.onerror = () => console.info(`Geluidseffect ontbreekt: ${url}`);
  const p = sfx.play();
  if (p) p.catch(() => {});
}

// ---------- Gesynthetiseerde geluiden ----------

function now() { return ctx ? ctx.currentTime : 0; }
function ready() { return ctx && !isMuted(); }

function tone({ type = 'sine', freq = 440, to = null, start = 0, dur = 0.2, vol = 0.2, attack = 0.005, filter = null }) {
  const t = now() + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = o;
  if (filter) {
    const f = ctx.createBiquadFilter();
    f.type = filter.type || 'lowpass';
    f.frequency.setValueAtTime(filter.freq, t);
    if (filter.to) f.frequency.exponentialRampToValueAtTime(filter.to, t + dur);
    node.connect(f);
    node = f;
  }
  node.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise({ start = 0, dur = 0.3, vol = 0.3, freq = 800, to = 100 }) {
  const t = now() + start;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(freq, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

/** Het intro-geluid: twee doffe klappen en een aanzwellend akkoord. */
export function tadum() {
  if (!ready()) return;
  // "ta"
  tone({ type: 'sine', freq: 90, to: 38, dur: 0.5, vol: 0.9 });
  noise({ dur: 0.25, vol: 0.5, freq: 1200, to: 80 });
  // "dum"
  tone({ type: 'sine', freq: 70, to: 30, start: 0.32, dur: 1.2, vol: 1 });
  noise({ start: 0.32, dur: 0.5, vol: 0.6, freq: 900, to: 60 });
  // aanzwellend akkoord
  const chord = [55, 82.4, 110, 164.8, 220, 329.6];
  chord.forEach((f, i) => {
    for (const det of [-4, 4]) {
      tone({
        type: 'sawtooth', freq: f * Math.pow(2, det / 1200), start: 0.45, dur: 2.8,
        vol: 0.05 / (1 + i * 0.35), attack: 1.1,
        filter: { freq: 300, to: 2400 },
      });
    }
  });
}

export function click() {
  if (!ready()) return;
  tone({ type: 'triangle', freq: 880, to: 440, dur: 0.08, vol: 0.12 });
}

export function select() {
  if (!ready()) return;
  tone({ type: 'sine', freq: 520, dur: 0.12, vol: 0.18 });
  tone({ type: 'sine', freq: 780, start: 0.08, dur: 0.22, vol: 0.18 });
}

export function whoosh() {
  if (!ready()) return;
  noise({ dur: 0.45, vol: 0.18, freq: 3000, to: 200 });
}

export function sting() {
  // korte dramatische klap bij een einde
  if (!ready()) return;
  tone({ type: 'sine', freq: 65, to: 32, dur: 1.6, vol: 0.9 });
  noise({ dur: 0.8, vol: 0.35, freq: 500, to: 40 });
  [130.8, 155.6, 196].forEach((f) => tone({ type: 'sawtooth', freq: f, dur: 2.2, vol: 0.04, attack: 0.05, filter: { freq: 1600, to: 200 } }));
}
