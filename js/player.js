/* Marcelflix — interactieve speler (Bandersnatch-stijl)
   Leest series/<serie>/<aflevering>/episode.json.
   Beeld per scène: <id>.jpg (of .png/.webp/.jpeg). Audio per scène: <id>.mp3.
   Ontbreekt iets, dan toont de speler een placeholder en loopt de tekst op tijd. */
(function () {
  "use strict";

  const CHOICE_SECONDS = 10;
  const ENDCARD_MS = 4200;
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- één gedeeld audio-element voor de verteller (nodig voor iOS) ---------- */
  const voice = new Audio();
  voice.preload = "auto";
  voice.setAttribute("playsinline", "");
  let primed = false;
  function silentWavUrl() {
    const n = 800, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
    const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVEfmt "); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
    v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, "data"); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  }
  /* Roep dit aan binnen een klik/tik, zodat de gsm later geluid toelaat. */
  function primeAudio() {
    if (window.Sound) Sound.unlock();
    if (primed) return;
    try {
      voice.src = silentWavUrl();
      const p = voice.play();
      if (p && p.then) p.then(() => { voice.pause(); primed = true; }).catch(() => {});
    } catch (e) {}
  }

  /* ---------- helpers ---------- */
  function splitSentences(text) {
    const parts = String(text).match(/[^.!?…]+[.!?…]+["”’)]*|[^.!?…]+$/g) || [text];
    return parts.map(s => s.trim()).filter(Boolean);
  }
  function estimateDuration(sentences) {
    // ~14 tekens per seconde + adempauze per zin, vergelijkbaar met een trage verteller
    return sentences.reduce((sum, s) => sum + s.length / 13.5 + 0.55, 0.6);
  }

  const lookColors = {
    noir: ["#1b1b1f", "#3a3a42"], cctv: ["#0c1a10", "#29462f"], warm: ["#3a1d0c", "#8a5226"],
    stranger: ["#16040a", "#5a0d1c"], default: ["#0e1626", "#2a3d5c"]
  };
  const phCache = {};
  function placeholder(id, prompt, look) {
    const key = id + "|" + look;
    if (phCache[key]) return phCache[key];
    const c = document.createElement("canvas"); c.width = 1600; c.height = 900;
    const g = c.getContext("2d"), [a, b] = lookColors[look] || lookColors.default;
    const grd = g.createLinearGradient(0, 0, 1600, 900); grd.addColorStop(0, a); grd.addColorStop(1, b);
    g.fillStyle = grd; g.fillRect(0, 0, 1600, 900);
    g.globalAlpha = 0.07; g.fillStyle = "#fff";
    for (let x = -900; x < 1600; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 900, 900); g.lineTo(x + 930, 900); g.lineTo(x + 30, 0); g.fill(); }
    g.globalAlpha = 1;
    g.textAlign = "center"; g.fillStyle = "rgba(255,255,255,.9)";
    g.font = "bold 150px 'Bebas Neue', Impact, sans-serif"; g.fillText(id.toUpperCase(), 800, 300);
    g.font = "600 34px Inter, sans-serif"; g.fillStyle = "#ffc93c"; g.fillText("BEELD NOG TOE TE VOEGEN  ·  " + id + ".jpg", 800, 370);
    g.font = "italic 34px Inter, sans-serif"; g.fillStyle = "rgba(255,255,255,.75)";
    const words = String(prompt || "").split(/\s+/); let line = "", y = 450;
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (g.measureText(test).width > 1050) { g.fillText(line, 800, y); y += 48; line = w; } else line = test;
      if (y > 700) break;
    }
    if (line && y <= 700) g.fillText(line, 800, y);
    return (phCache[key] = c.toDataURL("image/jpeg", 0.8));
  }

  function loadImage(urls) {
    return new Promise(res => {
      let i = 0; const img = new Image();
      const next = () => { if (i >= urls.length) return res(null); img.src = urls[i++]; };
      img.onload = () => res(img.src); img.onerror = next; next();
    });
  }

  /* ---------- Player ---------- */
  class Player {
    /* opts: { series, episodeId, basePath, onExit, store, checkUnlock, onOpenSeries } */
    constructor(opts) {
      this.o = opts;
      this.base = opts.basePath;
      this.history = [];
      this.assetCache = {};
      this.dead = false;
      this.paused = false;
      this.timers = new Set();
      this.build();
    }

    build() {
      const s = this.o.series;
      this.el = h(`
        <div class="player idle" role="application" aria-label="Speler">
          <div class="layer" data-l="0"><img alt=""></div>
          <div class="layer" data-l="1"><img alt=""></div>
          <div class="fx glow"></div><div class="fx redglow"></div><div class="fx scan"></div>
          <div class="fx vignette"></div><div class="fx grain"></div>
          <div class="rec">CAM 02 · 10:11:04</div>
          <div class="subs"></div>
          <div class="bigpause" aria-hidden="true">❚❚</div>
          <div class="pctl">
            <button class="pbtn" data-a="exit" aria-label="Terug">←</button>
            <div class="ttl"><b>${esc(s.title)}</b> · <span class="ept"></span></div>
            <div class="sp"></div>
            <button class="pbtn" data-a="mute" aria-label="Geluid aan/uit">🔊</button>
            <button class="pbtn" data-a="pause" aria-label="Pauze">❚❚</button>
            <button class="pbtn" data-a="skip" aria-label="Volgende scène">⏭</button>
            <button class="pbtn" data-a="fs" aria-label="Volledig scherm">⛶</button>
          </div>
          <div class="pbar"><i></i></div>
        </div>`);
      this.layers = [...this.el.querySelectorAll(".layer")];
      this.front = 0;
      this.subs = this.el.querySelector(".subs");
      this.bar = this.el.querySelector(".pbar i");
      this.el.querySelector(".pctl").addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b) return;
        e.stopPropagation();
        const a = b.dataset.a;
        if (a === "exit") this.exit();
        if (a === "pause") this.togglePause();
        if (a === "skip") this.skip();
        if (a === "mute") { const m = !Sound.muted; Sound.setMuted(m); voice.muted = m; b.textContent = m ? "🔇" : "🔊"; }
        if (a === "fs") this.fullscreen(true);
        this.poke();
      });
      this.el.addEventListener("click", e => {
        if (e.target.closest(".choice, .final, .endcard, .pctl")) return;
        if (this.el.classList.contains("idle")) this.poke(); else this.togglePause();
      });
      this.onKey = (e) => {
        if (e.key === " ") { e.preventDefault(); this.togglePause(); }
        if (e.key === "ArrowRight") this.skip();
        if (e.key === "Escape" && !document.fullscreenElement) this.exit();
        if (this.choiceEl && (e.key === "1" || e.key === "2")) this.choiceEl.querySelectorAll(".opt")[+e.key - 1]?.click();
      };
      window.addEventListener("keydown", this.onKey);
      document.body.appendChild(this.el);
      document.body.classList.add("playing");
      this.el.addEventListener("pointermove", () => this.poke());
    }

    poke() {
      this.el.classList.remove("idle");
      clearTimeout(this.idleT);
      this.idleT = setTimeout(() => { if (!this.paused) this.el.classList.add("idle"); }, 2800);
    }

    later(fn, ms) { const t = setTimeout(() => { this.timers.delete(t); if (!this.dead) fn(); }, ms); this.timers.add(t); return t; }

    fullscreen(force) {
      const d = document.documentElement;
      if (document.fullscreenElement && force) { document.exitFullscreen?.().catch(() => {}); return; }
      if (!document.fullscreenElement && d.requestFullscreen) {
        d.requestFullscreen({ navigationUI: "hide" }).then(() => {
          try { screen.orientation?.lock?.("landscape").catch(() => {}); } catch (e) {}
        }).catch(() => {});
      }
    }

    async load() {
      const r = await fetch(this.base + "episode.json", { cache: "no-cache" });
      if (!r.ok) throw new Error("episode.json niet gevonden in " + this.base);
      this.ep = await r.json();
      this.el.querySelector(".ept").textContent = "Afl. " + (this.o.episodeNumber || 1) + " · " + this.ep.title;
    }

    async start(fromScene) {
      try { await this.load(); } catch (e) { this.fail(e); return; }
      Sound.startPad(this.o.series.theme, this.o.series.music);
      this.preload(fromScene || this.ep.start);
      if (!fromScene) await this.titleCard();
      if (this.dead) return;
      this.maybeRotateHint();
      this.play(fromScene || this.ep.start);
    }

    fail(e) {
      this.el.innerHTML = `<div class="final"><h2>Oei. Marcel heeft de kabel doorgebeten.</h2><p class="count">${esc(e.message)}</p><button class="btn play" data-x>Terug</button></div>`;
      this.el.querySelector("[data-x]").onclick = () => this.exit();
    }

    titleCard() {
      return new Promise(res => {
        const s = this.o.series, l = s.logoLine || [s.title];
        const card = h(`<div class="endcard" style="background:#000">
          <div><small>MARCELFLIX ORIGINAL</small>
          <h1 class="slogo ${esc(s.theme)}"><span class="l1">${esc(l[0])}</span>${l[1] ? `<span class="l2">${esc(l[1])}</span>` : ""}</h1>
          <p>Aflevering ${esc(this.o.episodeNumber || 1)} · ${esc(this.ep.title)}</p></div></div>`);
        this.el.appendChild(card);
        Sound.tadum();
        const done = () => { card.style.transition = "opacity .8s"; card.style.opacity = "0"; this.later(() => { card.remove(); res(); }, 800); };
        const t = this.later(done, 3600);
        card.addEventListener("click", () => { clearTimeout(t); done(); }, { once: true });
      });
    }

    maybeRotateHint() {
      if (!matchMedia("(orientation: portrait)").matches || innerWidth > 800) return;
      const hint = h(`<div class="hint"><span class="ph">📱</span>Draai je gsm voor de echte bioscoopervaring</div>`);
      this.el.appendChild(hint);
      this.later(() => hint.remove(), 3500);
    }

    imageUrls(id, sc) {
      if (sc.image) return [this.base + sc.image];
      return ["jpg", "png", "webp"].map(x => this.base + id + "." + x);
    }
    assets(id) {
      if (this.assetCache[id]) return this.assetCache[id];
      const sc = this.ep.scenes[id];
      const p = (async () => {
        const img = await loadImage(this.imageUrls(id, sc));
        const audioUrl = this.base + (sc.audio || id + ".mp3");
        let hasAudio = false;
        try { const r = await fetch(audioUrl, { method: "HEAD" }); hasAudio = r.ok; } catch (e) {}
        if (hasAudio) fetch(audioUrl).catch(() => {}); // cache opwarmen
        return { img: img || placeholder(id, sc.prompt, sc.look), audioUrl: hasAudio ? audioUrl : null };
      })();
      return (this.assetCache[id] = p);
    }
    preload(id) {
      const sc = this.ep.scenes[id]; if (!sc) return;
      const nexts = [];
      if (sc.next) nexts.push(sc.next);
      if (sc.choice) sc.choice.options.forEach(o => nexts.push(o.next));
      [id, ...nexts].forEach(n => this.ep.scenes[n] && this.assets(n));
    }

    showImage(src, sc, dur) {
      const nextIdx = 1 - this.front, layer = this.layers[nextIdx], img = layer.querySelector("img");
      layer.className = "layer";
      img.style.objectPosition = sc.focus || "50% 50%";
      img.src = src;
      void layer.offsetWidth;
      const motion = sc.motion === "none" ? "" : "kb-" + (sc.motion || "in");
      layer.style.setProperty("--dur", Math.max(6, dur + 2.5) + "s");
      layer.className = "layer on " + motion;
      this.layers[this.front].classList.remove("on");
      this.front = nextIdx;
      ["noir", "cctv", "warm", "stranger"].forEach(l => this.el.classList.toggle("look-" + l, sc.look === l));
    }

    setSub(text) {
      if (text === this.lastSub) return;
      this.lastSub = text;
      this.subs.className = "subs";
      this.subs.innerHTML = text ? `<span class="who">MARCEL</span><span class="line">${esc(text)}</span>` : "";
      void this.subs.offsetWidth; if (text) this.subs.className = "subs fade";
    }

    async play(id) {
      const sc = this.ep.scenes[id];
      if (!sc) return this.finish();
      this.cur = id;
      this.history.push(id);
      this.o.store.setContinue(this.o.series.id, this.o.episodeId, id, this.history.length);
      const token = (this.token = {});
      const a = await this.assets(id);
      if (this.dead || token !== this.token) return;
      this.preload(id);

      const sentences = splitSentences(sc.text);
      let weights = sentences.map(s => s.length + 12);
      let total = weights.reduce((x, y) => x + y, 0);
      let dur = estimateDuration(sentences), useAudio = false;

      if (a.audioUrl) {
        useAudio = await new Promise(res => {
          let done = false; const fin = v => { if (!done) { done = true; res(v); } };
          voice.onloadedmetadata = () => fin(isFinite(voice.duration) && voice.duration > 0);
          voice.onerror = () => fin(false);
          setTimeout(() => fin(false), 8000);
          voice.src = a.audioUrl; voice.muted = Sound.muted; voice.load();
        });
        if (this.dead || token !== this.token) return;
        if (useAudio) dur = voice.duration;
        // Stem in een andere taal ("narration"): ondertitels op het ritme van die zinnen
        const spoken = useAudio && sc.narration ? splitSentences(sc.narration) : null;
        if (spoken && spoken.length === sentences.length) {
          weights = spoken.map(s => s.length + 12);
          total = weights.reduce((x, y) => x + y, 0);
        }
      }

      this.showImage(a.img, sc, dur);
      if (sc.sfx && Sound[sc.sfx]) Sound[sc.sfx]();
      Sound.duck(true);

      if (useAudio) {
        try { await voice.play(); } catch (e) { useAudio = false; }
      }
      const startPerf = performance.now();
      this.clock = { elapsed: 0, last: startPerf, useAudio, dur };
      const tail = 0.9;
      const loop = (now) => {
        if (this.dead || token !== this.token) return;
        const c = this.clock;
        if (!this.paused) {
          if (c.useAudio) c.elapsed = voice.ended ? Math.max(c.elapsed, c.dur) + (now - c.last) / 1000 : voice.currentTime;
          else c.elapsed += (now - c.last) / 1000;
        }
        c.last = now;
        const p = Math.min(1, c.elapsed / c.dur);
        let acc = 0, idx = 0;
        for (let i = 0; i < weights.length; i++) { acc += weights[i] / total; if (p <= acc + 1e-6) { idx = i; break; } idx = i; }
        this.setSub(sentences[idx]);
        this.bar.style.width = (p * 100) + "%";
        if (c.elapsed >= c.dur + tail) { this.sceneDone(sc, token); return; }
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    sceneDone(sc, token) {
      if (token !== this.token) return;
      this.token = {};
      cancelAnimationFrame(this.raf);
      Sound.duck(false);
      if (sc.ending) return this.showEnding(sc);
      if (sc.choice) return this.showChoice(sc);
      this.setSub("");
      if (sc.next) this.play(sc.next); else this.finish(sc);
    }

    skip() {
      if (this.choiceEl || this.finalEl || !this.cur) return;
      voice.pause();
      this.sceneDone(this.ep.scenes[this.cur], this.token);
    }

    togglePause() {
      if (this.finalEl) return;
      this.paused = !this.paused;
      this.el.classList.toggle("paused", this.paused);
      this.el.querySelector('[data-a="pause"]').textContent = this.paused ? "▶" : "❚❚";
      if (this.clock?.useAudio) { if (this.paused) voice.pause(); else voice.play().catch(() => {}); }
      if (this.paused) this.el.classList.remove("idle"); else this.poke();
    }

    showChoice(sc, fromRewind) {
      this.setSub("");
      Sound.sting();
      const ch = sc.choice;
      const el = h(`<div class="choice" role="dialog" aria-label="Keuze">
          <div class="q">${esc(ch.prompt || "Wat doe je?")}</div>
          <div class="timer"><i></i></div>
          <div class="opts">${ch.options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o.label)}</button>`).join("")}</div>
        </div>`);
      this.choiceEl = el;
      this.el.appendChild(el);
      const bar = el.querySelector(".timer i");
      const t0 = performance.now(); let lastTick = CHOICE_SECONDS, pausedAt = 0, pausedTotal = 0, chosen = false;
      const choose = (i) => {
        if (chosen) return; chosen = true;
        Sound.pick();
        el.querySelectorAll(".opt").forEach((b, j) => b.classList.add(j === i ? "picked" : "gone"));
        this.later(() => { el.remove(); this.choiceEl = null; this.play(ch.options[i].next); }, 750);
      };
      el.querySelectorAll(".opt").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); choose(+b.dataset.i); }));
      const tick = (now) => {
        if (this.dead || chosen) return;
        if (this.paused) { if (!pausedAt) pausedAt = now; }
        else if (pausedAt) { pausedTotal += now - pausedAt; pausedAt = 0; }
        const el2 = (now - t0 - pausedTotal - (pausedAt ? now - pausedAt : 0)) / 1000;
        const left = Math.max(0, CHOICE_SECONDS - el2);
        bar.style.transform = `scaleX(${left / CHOICE_SECONDS})`;
        const sec = Math.ceil(left);
        if (sec < lastTick && sec <= 4 && sec > 0) Sound.tick();
        lastTick = sec;
        if (left <= 0) return choose(ch.default ?? 0);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    showEnding(sc) {
      this.setSub("");
      const e = sc.ending;
      const isNew = this.o.store.addEnding(this.o.series.id, this.o.episodeId, e.id);
      Sound.ending();
      const card = h(`<div class="endcard"><div>
          <small>EINDE ${esc(e.id)}</small><h2>${esc(e.title)}</h2>
          <p>${isNew ? "Nieuw einde ontdekt" : "Dit einde had je al gevonden"}</p></div></div>`);
      this.el.appendChild(card);
      const go = () => { card.remove(); if (sc.next) this.play(sc.next); else this.finish(sc); };
      const t = this.later(go, ENDCARD_MS);
      card.addEventListener("click", () => { clearTimeout(t); this.timers.delete(t); go(); }, { once: true });
    }

    lastChoiceScene() {
      for (let i = this.history.length - 1; i >= 0; i--) if (this.ep.scenes[this.history[i]].choice) return i;
      return -1;
    }

    rewindToChoice() {
      const i = this.lastChoiceScene(); if (i < 0) return this.restart();
      const id = this.history[i];
      this.history = this.history.slice(0, i + 1);
      this.cur = id;
      this.closeFinal();
      this.assets(id).then(a => { this.showImage(a.img, this.ep.scenes[id], 12); this.showChoice(this.ep.scenes[id], true); });
    }

    restart() {
      this.closeFinal();
      this.history = [];
      this.play(this.ep.start);
    }

    closeFinal() { if (this.finalEl) { this.finalEl.remove(); this.finalEl = null; } }

    finish(sc) {
      cancelAnimationFrame(this.raf);
      this.setSub("");
      this.bar.style.width = "100%";
      this.o.store.clearContinue(this.o.series.id, this.o.episodeId);
      this.o.store.markWatched(this.o.series.id, this.o.episodeId);
      const found = this.o.store.endings(this.o.series.id, this.o.episodeId);
      const endings = Object.values(this.ep.scenes).filter(s => s.ending).map(s => s.ending);
      const total = this.ep.endingsTotal ?? endings.length;
      const unlocked = this.o.checkUnlock ? this.o.checkUnlock() : null;
      const teaserSeries = sc && sc.teaser && this.o.catalog ? this.o.catalog.find(x => x.id === sc.teaser) : null;
      const hasChoices = Object.values(this.ep.scenes).some(s => s.choice);
      const el = h(`<div class="final">
          <h2>${total ? "Einde van de aflevering" : "Einde"}</h2>
          ${total ? `<div class="count">Je vond ${found.length} van de ${total} eindes</div>
          <div class="ends">${endings.map(e => {
            const got = found.includes(e.id);
            return `<div class="e ${got ? "got" : ""}"><b>${esc(e.id)}</b><span>${got ? esc(e.title) : "???"}</span></div>`;
          }).join("")}</div>` : `<div class="count">Met liefde gemaakt. Met pootjes goedgekeurd.</div>`}
          ${unlocked ? `<button class="unlock" data-a="unlock">🔓 Geheime aflevering ontgrendeld: ${esc(unlocked.title)}</button>` :
            (total && found.length < total ? `<div class="teaser">Vind alle eindes om iets geheims te ontgrendelen…</div>` : "")}
          <div class="btns" style="justify-content:center">
            ${hasChoices ? `<button class="btn play" data-a="rewind">↺ Andere keuze proberen</button>` : ""}
            <button class="btn info" data-a="restart">Opnieuw bekijken</button>
            <button class="btn ghost" data-a="exit">Naar Marcelflix</button>
          </div>
          ${teaserSeries ? `<div class="teaser">Volgende week op Marcelflix: <b>${esc(teaserSeries.title)}</b></div>` : ""}
        </div>`);
      el.addEventListener("click", e => {
        const b = e.target.closest("[data-a]"); if (!b) return;
        e.stopPropagation();
        const a = b.dataset.a;
        if (a === "rewind") this.rewindToChoice();
        if (a === "restart") this.restart();
        if (a === "exit") this.exit();
        if (a === "unlock") { this.exit(true); this.o.onOpenSeries && this.o.onOpenSeries(unlocked.id); }
      });
      this.finalEl = el;
      this.el.appendChild(el);
    }

    exit(silent) {
      if (this.dead) return;
      this.dead = true;
      this.token = {};
      cancelAnimationFrame(this.raf);
      this.timers.forEach(clearTimeout); this.timers.clear();
      clearTimeout(this.idleT);
      voice.pause();
      voice.onloadedmetadata = voice.onerror = null;
      Sound.stopPad();
      window.removeEventListener("keydown", this.onKey);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      this.el.remove();
      document.body.classList.remove("playing");
      if (!silent && this.o.onExit) this.o.onExit();
    }
  }

  window.MarcelPlayer = { Player, primeAudio, splitSentences };
})();
