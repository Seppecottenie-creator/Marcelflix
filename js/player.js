// De speler: scènes met Ken Burns-beweging, vertelstem, ondertitels,
// keuzes met timer, eindes en eindscherm.
import { store } from './store.js';
import { loadEpisode, fileExists, resolveUrl, directorsCutUnlocked } from './data.js';
import * as sound from './sound.js';
import { esc, fromHTML, icon, artHTML, marcelSVG, titleHTML, toggleFullscreen } from './ui.js';

const CHOICE_SECONDS = 10;
const ENDCARD_SECONDS = 15;
const TITLECARD_SECONDS = 3.6;

const CAMERA = {
  'zoom-in':   ['scale(1.02)', 'scale(1.18)', 'ease-in-out'],
  'zoom-out':  ['scale(1.2)', 'scale(1.03)', 'ease-in-out'],
  'pan-left':  ['scale(1.16) translateX(4%)', 'scale(1.16) translateX(-4%)', 'ease-in-out'],
  'pan-right': ['scale(1.16) translateX(-4%)', 'scale(1.16) translateX(4%)', 'ease-in-out'],
  'pan-up':    ['scale(1.16) translateY(4%)', 'scale(1.16) translateY(-4%)', 'ease-in-out'],
  'pan-down':  ['scale(1.16) translateY(-4%)', 'scale(1.16) translateY(4%)', 'ease-in-out'],
  dolly:       ['scale(1)', 'scale(1.5)', 'cubic-bezier(.7,0,.9,.6)'],
  still:       ['scale(1.04)', 'scale(1.05)', 'linear'],
};
const CAMERA_CYCLE = ['zoom-in', 'pan-right', 'zoom-out', 'pan-left'];

/** Pauzeerbare klok in seconden. */
class Clock {
  constructor() { this.reset(); }
  reset() { this.acc = 0; this.since = null; }
  play() { if (this.since == null) this.since = performance.now(); }
  pause() { if (this.since != null) { this.acc += performance.now() - this.since; this.since = null; } }
  get t() { return (this.acc + (this.since != null ? performance.now() - this.since : 0)) / 1000; }
}

/** Tekst → zinnen. [Tekst tussen haken] is een aparte regel (placeholder). */
export function splitSentences(text) {
  const parts = String(text || '').match(/\[[^\]]*\]|[^.!?…[]+(?:[.!?…]+["”’']?|$)/g) || [];
  return parts.map((s) => s.trim()).filter(Boolean);
}

const isPlaceholder = (s) => /^\[.*\]$/.test(s);

function estimateSeconds(sentence) {
  return Math.max(1.4, sentence.length / 13.5) + 0.35;
}

/** Ondertitels: timing verdeeld volgens de lengte van elke zin. */
function buildCues(sentences, total, withAudio) {
  const weights = sentences.map((s) => (withAudio && isPlaceholder(s) ? 0 : withAudio ? s.length + 4 : estimateSeconds(s)));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const lead = withAudio ? Math.min(0.15, total * 0.05) : 0;
  const span = total - lead;
  let t = lead;
  return sentences.map((text, i) => {
    const d = (weights[i] / sum) * span;
    const cue = { text, start: t, end: t + d };
    t += d;
    return cue;
  }).filter((c) => c.end > c.start);
}

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    const finish = (ok) => { if (!done) { done = true; clearTimeout(to); resolve(ok ? img : null); } };
    const to = setTimeout(() => finish(false), 12000);
    img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => finish(true));
    img.onerror = () => finish(false);
    img.src = url;
  });
}

function hashIndex(str, n) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % n;
}

/** Afstand (in scènes) van elke scène tot het einde van de aflevering: voor de voortgangsbalk. */
function distancesToEnd(scenes) {
  const edges = (sc) => [sc.next, ...(sc.choice?.options || []).map((o) => o.next)].filter((x) => x && scenes[x]);
  const dist = {};
  for (const [id, sc] of Object.entries(scenes)) if (!edges(sc).length) dist[id] = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (const [id, sc] of Object.entries(scenes)) {
      const ds = edges(sc).map((x) => dist[x]).filter((x) => x != null);
      if (ds.length) {
        const d = 1 + Math.min(...ds);
        if (dist[id] == null || d < dist[id]) { dist[id] = d; changed = true; }
      }
    }
  }
  return dist;
}

export async function renderPlayer(app, site, series, epId, opts = {}) {
  let ep;
  try {
    ep = await loadEpisode(series, epId);
  } catch (e) {
    app.replaceChildren(fromHTML(`<div class="player"><div class="pl-error"><div>
      <h2>Deze aflevering kon niet geladen worden</h2>
      <pre>${esc(e.message)}</pre>
      <p><a class="btn btn-play" href="#/serie/${esc(series.id)}">Terug</a></p></div></div></div>`));
    return () => {};
  }
  const player = new Player(app, site, series, ep, opts);
  player.begin();
  return () => player.destroy();
}

class Player {
  constructor(app, site, series, ep, opts) {
    this.app = app;
    this.site = site;
    this.series = series;
    this.ep = ep;
    this.opts = opts;
    this.token = 0;
    this.phase = 'idle';
    this.paused = false;
    this.clock = new Clock();       // vertelling zonder audio
    this.phaseClock = new Clock();  // titelkaart, pauzes, keuzes, eindkaart
    this.history = [];
    this.cues = [];
    this.cueIndex = -1;
    this.audioOk = false;
    this.kbAnim = null;
    this.dist = distancesToEnd(ep.scenes);
    this.choiceSeconds = ep.choiceSeconds || CHOICE_SECONDS;
    this.debug = !!opts.debug;
    this.listeners = [];
    this.build();
  }

  // ---------------------------------------------------------------
  // Opbouw
  // ---------------------------------------------------------------
  build() {
    const s = this.series;
    const subsOn = store.setting('subs', true);
    this.el = fromHTML(`<div class="player theme-${esc(s.theme)}" role="region" aria-label="Speler">
      <div class="pl-backdrop"></div>
      <div class="pl-frame">
        <div class="pl-kb"></div>
        <div class="pl-ph-info" hidden></div>
        <div class="pl-fx"></div>
        <div class="pl-grain"></div>
        <div class="pl-vignette"></div>
        <div class="pl-veil"></div>
      </div>
      <div class="pl-label" hidden></div>
      <div class="pl-subs ${subsOn ? '' : 'off'}" aria-live="polite"><span></span></div>
      <div class="pl-choice" aria-live="assertive">
        <div class="pl-choice-prompt"></div>
        <div class="pl-timer"><i></i></div>
        <div class="pl-options"></div>
      </div>
      <div class="pl-hud">
        <div class="pl-top">
          <button class="icon-btn" data-act="close" aria-label="Sluiten">${icon.back}</button>
          <div class="pl-top-title"><b>${esc(s.title)}</b> · A${this.ep.meta.number}: ${esc(this.ep.title || this.ep.meta.title)}</div>
          <span style="width:44px"></span>
        </div>
        <div class="pl-bottom">
          <button class="icon-btn" data-act="pause" aria-label="Pauzeren">${icon.pause}</button>
          <button class="icon-btn" data-act="skip" aria-label="Overslaan">${icon.skip}</button>
          <button class="icon-btn ${subsOn ? '' : 'off'}" data-act="subs" aria-label="Ondertitels">${icon.subs}</button>
          <button class="icon-btn" data-act="mute" aria-label="Geluid">${sound.isMuted() ? icon.mute : icon.sound}</button>
          <button class="icon-btn" data-act="full" aria-label="Volledig scherm">${icon.full}</button>
          <div class="pl-progress"><i></i></div>
        </div>
      </div>
      <div class="pl-debug" ${this.debug ? '' : 'hidden'}></div>
    </div>`);
    this.$ = (sel) => this.el.querySelector(sel);
    this.kb = this.$('.pl-kb');
    this.veilEl = this.$('.pl-veil');
    this.subsSpan = this.$('.pl-subs span');
    this.choiceEl = this.$('.pl-choice');
    this.timerBar = this.$('.pl-timer i');

    this.app.replaceChildren(this.el);
    document.body.style.overflow = 'hidden';

    this.el.addEventListener('click', (e) => this.onClick(e));
    this.on(this.el, 'pointermove', (e) => { if (e.pointerType === 'mouse') this.showHud(); });
    this.on(document, 'keydown', (e) => this.onKey(e));
    this.on(document, 'visibilitychange', () => { if (document.hidden && !this.paused && this.isRunning()) this.pause(); });
    this.showHud();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    this.listeners.push(() => target.removeEventListener(type, fn, opts));
  }

  destroy() {
    this.destroyed = true;
    this.token++;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.hudTimer);
    this.listeners.forEach((off) => off());
    this.kbAnim?.cancel();
    sound.narration.pause();
    sound.stopMusic();
    document.body.style.overflow = '';
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) {
      try { (d.exitFullscreen || d.webkitExitFullscreen)?.call(d); } catch (e) { /* */ }
    }
  }

  isRunning() { return ['title', 'narrating', 'gap', 'choice', 'ending'].includes(this.phase); }

  // ---------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------
  async begin() {
    const { ep, opts } = this;
    const prog = store.episode(ep.key);

    const musicUrl = resolveUrl(this.series, this.series.music);
    if (musicUrl && await fileExists(musicUrl)) sound.playMusic(musicUrl);
    if (this.destroyed) return;

    if (!sound.isUnlocked()) {
      this.needTap('Tik om af te spelen');
    }

    if (opts.scene && ep.scenes[opts.scene]) {
      this.go(opts.scene);
    } else if (opts.resume && prog.lastScene && ep.scenes[prog.lastScene] && !prog.finished) {
      const h = [...(prog.history || [])];
      if (h[h.length - 1] === prog.lastScene) h.pop();
      this.history = h.filter((id) => ep.scenes[id]);
      this.go(prog.lastScene);
    } else {
      this.showTitleCard();
    }
  }

  showTitleCard() {
    const s = this.series;
    const card = fromHTML(`<div class="pl-titlecard theme-${esc(s.theme)}">
      <div class="kicker"><span class="logo">M</span> Een Marcelflix Original</div>
      <div class="t-title">${titleHTML(s.title)}</div>
      <div class="ep">Aflevering ${this.ep.meta.number} · ${esc(this.ep.title || this.ep.meta.title)}</div>
    </div>`);
    this.el.appendChild(card);
    this.titleCard = card;
    this.phase = 'title';
    this.phaseClock.reset();
    if (!this.paused) this.phaseClock.play();
  }

  endTitleCard() {
    const card = this.titleCard;
    this.titleCard = null;
    if (card) {
      card.classList.add('hide');
      setTimeout(() => card.remove(), 900);
    }
    this.go(this.ep.start);
  }

  // ---------------------------------------------------------------
  // Scènes
  // ---------------------------------------------------------------
  async go(id, { push = true } = {}) {
    const token = ++this.token;
    const { ep } = this;
    const scene = ep.scenes[id];
    this.phase = 'loading';
    this.el.classList.remove('choosing');
    this.choiceEl.classList.remove('show');
    this.el.querySelector('.pl-end')?.remove();
    sound.narration.pause();
    this.setSub('');

    if (!scene) {
      this.fail(`Scène "${id}" bestaat niet in ${ep.base}episode.json`);
      return;
    }
    if (push) this.history.push(id);
    store.updateEpisode(ep.key, (p) => ({
      ...p,
      lastScene: id,
      history: [...this.history],
      seen: [...new Set([...(p.seen || []), id])],
    }));

    this.veilEl.classList.remove('open');
    const imgUrl = ep.base + (scene.image || `${id}.jpg`);
    const audioUrl = ep.base + (scene.audio || `${id}.mp3`);
    const [img, audioDur] = await Promise.all([
      loadImage(imgUrl),
      this.prepareAudio(audioUrl, token),
      new Promise((r) => setTimeout(r, 420)), // laat de overgang naar zwart afspelen
    ]);
    if (token !== this.token || this.destroyed) return;

    this.current = id;
    this.scene = scene;
    this.audioOk = audioDur != null;

    // --- beeld of placeholder ---
    this.kbAnim?.cancel();
    const info = this.$('.pl-ph-info');
    if (img) {
      img.alt = scene.prompt || '';
      this.kb.replaceChildren(img);
      this.$('.pl-backdrop').style.backgroundImage = `url("${img.src}")`;
      info.hidden = true;
    } else {
      this.kb.replaceChildren(fromHTML(`<div class="pl-ph">${artHTML(this.series, { image: null, title: false, mark: false })}</div>`));
      this.$('.pl-backdrop').style.backgroundImage = '';
      info.hidden = false;
      info.innerHTML = `
        <div class="pl-ph-id">${esc(id)}</div>
        <div class="pl-ph-file">Beeld ontbreekt · ${esc(scene.image || `${id}.jpg`)}${this.audioOk ? '' : ' · geen audio'}</div>
        ${scene.prompt ? `<div class="pl-ph-prompt">${esc(scene.prompt)}</div>` : ''}
        ${scene.note ? `<div class="pl-ph-note">${esc(scene.note)}</div>` : ''}`;
    }
    this.el.classList.remove('fx-vhs', 'fx-flicker', 'fx-noir');
    if (scene.effect) this.el.classList.add(`fx-${scene.effect}`);
    const label = this.$('.pl-label');
    label.hidden = !scene.label;
    label.textContent = scene.label || '';

    // --- timing + ondertitels ---
    const sentences = splitSentences(scene.text);
    const estimated = sentences.reduce((a, s) => a + estimateSeconds(s), 0) || scene.duration || 3;
    this.narrDur = this.audioOk ? audioDur : (scene.duration || estimated);
    this.cues = buildCues(sentences, this.narrDur, this.audioOk);
    this.cueIndex = -1;

    // --- camerabeweging ---
    const extra = scene.choice ? this.choiceSeconds + 2 : scene.ending ? 6 : 1.5;
    this.startCamera(scene, id, (this.narrDur + extra) * 1000);

    // --- geluid ---
    if (scene.music) {
      const url = resolveUrl(this.series, scene.music);
      if (url && await fileExists(url)) sound.playMusic(url);
      if (token !== this.token) return;
    }
    if (scene.sfx) {
      const s = typeof scene.sfx === 'string' ? { file: scene.sfx } : scene.sfx;
      const url = s.file.startsWith('assets/') ? s.file : ep.base + s.file;
      this.sfxTimer = setTimeout(() => sound.playSfx(url, s.volume ?? 1), (s.at || 0) * 1000);
    }

    this.veilEl.classList.add('open');
    this.preloadNext(scene);
    this.updateProgress();
    this.updateDebug();

    this.phase = 'narrating';
    this.clock.reset();
    sound.duckMusic(true);
    if (!this.paused) this.startNarration();
  }

  prepareAudio(url, token) {
    return fileExists(url).then((exists) => {
      if (!exists || token !== this.token) return null;
      const a = sound.narration;
      return new Promise((resolve) => {
        let done = false;
        const finish = (ok) => {
          if (done) return;
          done = true;
          clearTimeout(to);
          a.removeEventListener('loadedmetadata', onMeta);
          a.removeEventListener('error', onErr);
          resolve(ok ? a.duration : null);
        };
        const onMeta = () => finish(Number.isFinite(a.duration) && a.duration > 0);
        const onErr = () => finish(false);
        const to = setTimeout(() => finish(false), 8000);
        a.addEventListener('loadedmetadata', onMeta);
        a.addEventListener('error', onErr);
        a.src = url;
        a.load();
      });
    });
  }

  startNarration() {
    if (this.audioOk) {
      const p = sound.narration.play();
      if (p) p.catch((err) => { if (err && err.name === 'NotAllowedError') this.needTap('Tik om verder te kijken'); });
    } else {
      this.clock.play();
    }
    this.kbAnim?.play();
  }

  startCamera(scene, id, ms) {
    let cam = scene.camera;
    let from, to, easing;
    if (cam && typeof cam === 'object') {
      ({ from, to } = cam);
      easing = cam.easing || 'ease-in-out';
    } else {
      cam = CAMERA[cam] ? cam : CAMERA_CYCLE[hashIndex(id, CAMERA_CYCLE.length)];
      [from, to, easing] = CAMERA[cam];
    }
    this.kb.style.transformOrigin = scene.focus || '50% 50%';
    if (!this.kb.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.kb.style.transform = from;
      this.kbAnim = null;
      return;
    }
    this.kbAnim = this.kb.animate([{ transform: from }, { transform: to }], { duration: Math.max(1000, ms), easing, fill: 'forwards' });
    this.kbAnim.pause();
  }

  preloadNext(scene) {
    const ids = [scene.next, ...(scene.choice?.options || []).map((o) => o.next)].filter(Boolean);
    for (const id of ids) {
      const sc = this.ep.scenes[id];
      if (!sc) continue;
      const url = this.ep.base + (sc.image || `${id}.jpg`);
      fileExists(url).then((ok) => { if (ok) { const i = new Image(); i.src = url; } });
      fileExists(this.ep.base + (sc.audio || `${id}.mp3`));
    }
  }

  // ---------------------------------------------------------------
  // Hoofdlus
  // ---------------------------------------------------------------
  loop() {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.loop);
    if (this.paused) return;

    switch (this.phase) {
      case 'title':
        if (this.phaseClock.t >= TITLECARD_SECONDS) { this.phase = 'loading'; this.endTitleCard(); }
        break;
      case 'narrating': {
        const a = sound.narration;
        const t = this.audioOk ? a.currentTime : this.clock.t;
        this.updateSubs(t);
        const done = this.audioOk ? (a.ended || (a.duration && t >= a.duration - 0.03)) : t >= this.narrDur;
        if (done) this.afterNarration();
        break;
      }
      case 'gap':
        if (this.phaseClock.t >= this.gapSeconds) this.go(this.scene.next);
        break;
      case 'choice': {
        const left = Math.max(0, 1 - this.phaseClock.t / this.choiceSeconds);
        this.timerBar.style.transform = `scaleX(${left})`;
        if (left <= 0) this.choose(this.scene.choice.default ?? 0, true);
        break;
      }
      case 'ending': {
        const left = Math.max(0, 1 - this.phaseClock.t / ENDCARD_SECONDS);
        const fill = this.el.querySelector('.pl-end [data-act="continue"] .fill');
        const n = this.el.querySelector('.pl-end [data-count]');
        if (fill) fill.style.width = `${(1 - left) * 100}%`;
        if (n) n.textContent = Math.ceil(left * ENDCARD_SECONDS);
        if (left <= 0) this.continueAfterEnding();
        break;
      }
      default:
    }
  }

  updateSubs(t) {
    const cues = this.cues;
    if (!cues.length) return;
    let i = cues.findIndex((c) => t >= c.start && t < c.end);
    if (i < 0 && t >= cues[cues.length - 1].end) i = cues.length - 1;
    if (i !== this.cueIndex) {
      this.cueIndex = i;
      this.setSub(i >= 0 ? cues[i].text : '');
    }
  }

  setSub(text) {
    const span = this.subsSpan;
    span.textContent = text;
    span.classList.remove('fresh');
    if (text) { void span.offsetWidth; span.classList.add('fresh'); }
    span.style.display = text ? '' : 'none';
  }

  afterNarration() {
    const sc = this.scene;
    sound.narration.pause();
    sound.duckMusic(false);
    if (sc.choice) this.showChoice();
    else if (sc.ending) this.showEnding();
    else if (sc.next) {
      this.phase = 'gap';
      this.gapSeconds = sc.pause ?? 0.6;
      this.phaseClock.reset();
      this.phaseClock.play();
    } else this.episodeDone();
  }

  // ---------------------------------------------------------------
  // Keuzes
  // ---------------------------------------------------------------
  showChoice() {
    const ch = this.scene.choice;
    const seen = store.episode(this.ep.key).seen || [];
    this.setSub('');
    this.$('.pl-choice-prompt').textContent = ch.prompt || 'Wat doe je?';
    this.$('.pl-options').innerHTML = ch.options.map((o, i) => `
      <button class="pl-option" data-opt="${i}">
        <span class="key">${i + 1}</span>${esc(o.label)}
        ${seen.includes(o.next) ? '<span class="seen">al eens gekozen</span>' : ''}
      </button>`).join('');
    this.timerBar.style.transform = 'scaleX(1)';
    this.el.classList.add('choosing');
    this.choiceEl.classList.add('show');
    this.phase = 'choice';
    this.phaseClock.reset();
    this.phaseClock.play();
    sound.whoosh();
    this.showHud(false);
  }

  choose(i, auto = false) {
    if (this.phase !== 'choice') return;
    const ch = this.scene.choice;
    const opt = ch.options[i] || ch.options[0];
    this.phase = 'chosen';
    sound.select();
    this.el.querySelectorAll('.pl-option').forEach((b, j) => b.classList.add(j === i ? 'picked' : 'dropped'));
    const token = this.token;
    setTimeout(() => {
      if (token !== this.token || this.destroyed) return;
      this.choiceEl.classList.remove('show');
      this.el.classList.remove('choosing');
      this.go(opt.next);
    }, auto ? 900 : 650);
  }

  // ---------------------------------------------------------------
  // Eindes
  // ---------------------------------------------------------------
  showEnding() {
    const sc = this.scene;
    this.phase = 'ending';
    this.setSub('');
    const updated = store.updateEpisode(this.ep.key, (p) => ({
      ...p,
      endings: [...new Set([...(p.endings || []), sc.ending])],
    }));
    const found = updated.endings;
    const m = String(sc.ending).match(/^([^:]+):\s*(.+)$/);
    const kicker = m ? m[1] : 'Einde';
    const title = m ? m[2] : sc.ending;
    const hasOtherChoice = this.lastChoiceIndex() >= 0;
    const all = this.ep.endings;

    const el = fromHTML(`<div class="pl-end theme-${esc(this.series.theme)}">
      <div class="pl-end-inner">
        <div class="pl-end-kicker">${esc(kicker)}</div>
        <h2 class="pl-end-title t-title">${esc(title)}</h2>
        ${all.length > 1 ? `<div class="pl-end-found">
          <span>${all.filter((e) => found.includes(e.title)).length} van de ${all.length} eindes gevonden</span>
          <ul class="pl-end-list">${all.map((e) => {
            const on = found.includes(e.title);
            return `<li class="${on ? 'on' : ''}">${on ? esc(e.title.replace(/^[^:]+:\s*/, '')) : '???'}</li>`;
          }).join('')}</ul></div>` : ''}
        <div class="pl-end-actions">
          <button class="btn btn-ghost" data-act="restart">${icon.restart}<span>Opnieuw spelen</span></button>
          ${hasOtherChoice ? `<button class="btn btn-ghost" data-act="other">${icon.branch}<span>Andere keuze proberen</span></button>` : ''}
          <button class="btn btn-play" data-act="continue"><i class="fill"></i>${icon.play}<span>${sc.next ? 'Verder' : 'Afronden'} (<span data-count>${ENDCARD_SECONDS}</span>)</span></button>
        </div>
      </div>
    </div>`);
    this.el.appendChild(el);
    this.phaseClock.reset();
    this.phaseClock.play();
    sound.sting();
    this.showHud(false);
  }

  continueAfterEnding() {
    if (this.phase !== 'ending') return;
    this.el.querySelector('.pl-end')?.remove();
    if (this.scene.next) this.go(this.scene.next);
    else this.episodeDone();
  }

  lastChoiceIndex() {
    for (let i = this.history.length - 2; i >= 0; i--) {
      if (this.ep.scenes[this.history[i]]?.choice) return i;
    }
    return -1;
  }

  restart() {
    this.history = [];
    this.el.querySelector('.pl-done')?.remove();
    this.go(this.ep.start);
  }

  tryOtherChoice() {
    const i = this.lastChoiceIndex();
    if (i < 0) { this.restart(); return; }
    const id = this.history[i];
    this.history = this.history.slice(0, i);
    this.go(id);
  }

  episodeDone() {
    this.phase = 'done';
    sound.narration.pause();
    this.kbAnim?.pause();
    const before = directorsCutUnlocked(this.site);
    const p = store.updateEpisode(this.ep.key, (x) => ({ ...x, finished: true, lastScene: null, history: [], plays: (x.plays || 0) + 1 }));
    const after = directorsCutUnlocked(this.site);
    const justUnlocked = !before && after;
    if (justUnlocked) store.setFlag('dcUnlocked');

    const teaser = this.series.teaser ? this.site.seriesMap.get(this.series.teaser) : null;
    const all = this.ep.endings;
    const foundN = all.filter((e) => (p.endings || []).includes(e.title)).length;
    const missing = all.length - foundN;
    const outro = this.ep.outro;

    const el = fromHTML(`<div class="pl-done">
      <div class="pl-done-inner">
        ${outro ? `<h2 class="t-title theme-${esc(this.series.theme)}" style="font-size:clamp(34px,6vw,70px)">${esc(outro.title || '')}</h2>
          ${outro.text ? `<p>${esc(outro.text)}</p>` : ''}` : ''}
        ${justUnlocked ? `<div class="unlock">🔓 Je hebt alles gezien. Bijna alles. Er is iets ontgrendeld op Marcelflix.</div>` : ''}
        ${teaser && !outro ? `<div class="pl-end-kicker">Binnenkort op Marcelflix</div>
          <div class="teaser">${artHTML(teaser)}</div>
          <h2>${esc(teaser.title)}</h2>
          <p>${esc(teaser.tagline || '')}</p>` : ''}
        ${!teaser && !outro ? '<h2>Einde van de aflevering</h2>' : ''}
        ${all.length > 1 ? `<p>Je vond ${foundN} van de ${all.length} eindes.${missing ? ' Marcel weet waar de andere zitten. Marcel zegt niets.' : ' Allemaal. Marcel is onder de indruk (hij toont het niet).'}</p>` : ''}
        <div class="pl-end-actions">
          <button class="btn ${justUnlocked ? 'btn-red' : 'btn-play'}" data-act="home">${justUnlocked ? 'Bekijk wat er ontgrendeld is' : 'Terug naar Marcelflix'}</button>
          <button class="btn btn-ghost" data-act="restart">${icon.restart}<span>${missing ? 'Zoek de andere eindes' : 'Opnieuw kijken'}</span></button>
        </div>
      </div>
    </div>`);
    this.el.appendChild(el);
    if (teaser) sound.whoosh();
    this.showHud(false);
  }

  // ---------------------------------------------------------------
  // Bediening
  // ---------------------------------------------------------------
  onClick(e) {
    const opt = e.target.closest('[data-opt]');
    if (opt) { this.choose(+opt.dataset.opt); return; }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act) {
      e.stopPropagation();
      this.action(act);
      return;
    }
    if (e.target.closest('.pl-end, .pl-done, .pl-tap')) return;
    // tik op het beeld: HUD tonen/verbergen
    if (this.el.classList.contains('hud-hidden')) this.showHud();
    else this.hideHud();
  }

  action(act) {
    switch (act) {
      case 'close': location.hash = `#/serie/${this.series.id}`; break;
      case 'pause': this.paused ? this.resume() : this.pause(); break;
      case 'skip': this.skip(); break;
      case 'subs': {
        const on = !store.setting('subs', true);
        store.setSetting('subs', on);
        this.$('.pl-subs').classList.toggle('off', !on);
        this.$('[data-act="subs"]').classList.toggle('off', !on);
        break;
      }
      case 'mute': {
        sound.unlock();
        sound.setMuted(!sound.isMuted());
        this.$('[data-act="mute"]').innerHTML = sound.isMuted() ? icon.mute : icon.sound;
        break;
      }
      case 'full': toggleFullscreen(); break;
      case 'restart': sound.click(); this.phase = 'loading'; this.restart(); break;
      case 'other': sound.click(); this.phase = 'loading'; this.tryOtherChoice(); break;
      case 'continue': sound.click(); this.continueAfterEnding(); break;
      case 'home': location.hash = '#/home'; break;
      default:
    }
    this.showHud();
  }

  onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === ' ' || k === 'k') { e.preventDefault(); this.paused ? this.resume() : this.pause(); this.showHud(); }
    else if (k === 'ArrowRight' || k === 'l') this.skip();
    else if (/^[1-9]$/.test(k) && this.phase === 'choice') this.choose(+k - 1);
    else if (k === 'Enter' && this.phase === 'ending') this.continueAfterEnding();
    else if (k === 'c') this.action('subs');
    else if (k === 'm') this.action('mute');
    else if (k === 'f') this.action('full');
    else if (k === 'Escape' && !document.fullscreenElement) this.action('close');
  }

  skip() {
    if (this.paused) this.resume();
    if (this.phase === 'narrating') this.afterNarration();
    else if (this.phase === 'gap') this.go(this.scene.next);
    else if (this.phase === 'title') { this.phase = 'loading'; this.endTitleCard(); }
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    sound.narration.pause();
    this.clock.pause();
    this.phaseClock.pause();
    this.kbAnim?.pause();
    sound.pauseMusic();
    clearTimeout(this.sfxTimer);
    this.$('[data-act="pause"]').innerHTML = icon.play;
    this.$('[data-act="pause"]').setAttribute('aria-label', 'Afspelen');
    this.showHud(false);
  }

  resume() {
    this.el.querySelector('.pl-tap')?.remove();
    sound.unlock();
    this.paused = false;
    sound.resumeMusic();
    if (this.phase === 'narrating') this.startNarration();
    else if (['title', 'gap', 'choice', 'ending'].includes(this.phase)) this.phaseClock.play();
    if (this.phase === 'choice' || this.phase === 'ending' || this.phase === 'gap') this.kbAnim?.play();
    this.$('[data-act="pause"]').innerHTML = icon.pause;
    this.$('[data-act="pause"]').setAttribute('aria-label', 'Pauzeren');
    this.showHud();
  }

  needTap(text) {
    if (this.el.querySelector('.pl-tap')) return;
    this.pause();
    const tap = fromHTML(`<div class="pl-tap" role="button" tabindex="0"><div>${icon.play}<p>${esc(text)}</p></div></div>`);
    tap.addEventListener('click', (e) => { e.stopPropagation(); this.resume(); });
    this.el.appendChild(tap);
  }

  showHud(autoHide = true) {
    this.el.classList.remove('hud-hidden');
    clearTimeout(this.hudTimer);
    if (autoHide) this.hudTimer = setTimeout(() => this.hideHud(), 3200);
  }

  hideHud() {
    if (this.paused || this.phase === 'done') return;
    this.el.classList.add('hud-hidden');
  }

  updateProgress() {
    const pos = this.history.length;
    const rest = this.dist[this.current] ?? 0;
    const total = pos + rest;
    this.$('.pl-progress i').style.width = `${total ? (pos / total) * 100 : 0}%`;
  }

  updateDebug() {
    if (!this.debug) return;
    this.$('.pl-debug').textContent = `${this.current} · ${this.audioOk ? 'audio' : 'timing'} · ${this.narrDur.toFixed(1)}s`;
  }

  fail(message) {
    this.phase = 'error';
    this.el.appendChild(fromHTML(`<div class="pl-error"><div>
      <h2>Oeps. Marcel is de draad kwijt.</h2>
      <pre>${esc(message)}</pre>
      <p><button class="btn btn-play" data-act="close">Terug</button></p>
    </div></div>`));
  }
}

// Handig voor de ontwikkelaar in de console.
export const _test = { splitSentences, buildCues, distancesToEnd, marcelSVG };
