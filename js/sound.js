/* Marcelflix — gesynthetiseerde geluiden (WebAudio). Geen bestanden nodig.
   Eigen muziek? Zet "music" in catalog.json; dan speelt dat bestand i.p.v. de synth-pad. */
(function () {
  let ctx = null, master = null, muted = false;
  let padNodes = null, arpTimer = null, musicEl = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function noiseBuffer(sec) {
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function env(g, t, a, peak, dcy, end = 0.0001) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(end, t + a + dcy);
  }

  const S = {
    unlock() { ensure(); },
    get muted() { return muted; },
    setMuted(v) {
      muted = v;
      if (master) master.gain.setTargetAtTime(v ? 0 : 1, ctx.currentTime, 0.05);
      if (musicEl) musicEl.muted = v;
    },

    /* Het grote intro-geluid: diepe boem + openende akkoordzwel */
    tadum() {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.05;
      // boem 1 en 2
      [0, 0.32].forEach((off, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(i ? 70 : 90, t + off);
        o.frequency.exponentialRampToValueAtTime(38, t + off + 0.6);
        env(g, t + off, 0.01, i ? 0.9 : 0.7, i ? 1.4 : 0.5);
        o.connect(g).connect(master); o.start(t + off); o.stop(t + off + 2);
        const n = ctx.createBufferSource(), ng = ctx.createGain(), f = ctx.createBiquadFilter();
        n.buffer = noiseBuffer(0.3); f.type = "lowpass"; f.frequency.value = 900;
        env(ng, t + off, 0.005, 0.25, 0.25);
        n.connect(f).connect(ng).connect(master); n.start(t + off);
      });
      // zwel
      const chord = [110, 164.8, 220, 277.2, 329.6, 440];
      const f = ctx.createBiquadFilter(); f.type = "lowpass";
      f.frequency.setValueAtTime(300, t + 0.3); f.frequency.exponentialRampToValueAtTime(5000, t + 2.2);
      const g = ctx.createGain(); env(g, t + 0.3, 1.2, 0.16, 1.8);
      f.connect(g).connect(master);
      chord.forEach((fr, i) => {
        [-6, 6].forEach(det => {
          const o = ctx.createOscillator(); o.type = "sawtooth";
          o.frequency.value = fr; o.detune.value = det + i;
          o.connect(f); o.start(t + 0.3); o.stop(t + 3.5);
        });
      });
    },

    /* Spanningsstoot bij een keuze */
    sting() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [220, 233.1, 329.6].forEach(fr => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = fr;
        env(g, t, 0.02, 0.12, 1.2);
        o.connect(g).connect(master); o.start(t); o.stop(t + 1.4);
      });
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(60, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.8);
      env(g, t, 0.01, 0.6, 0.9); o.connect(g).connect(master); o.start(t); o.stop(t + 1);
    },

    /* Klein tikje tijdens de afteltimer */
    tick() {
      if (!ensure()) return;
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "square"; o.frequency.value = 1400;
      env(g, t, 0.002, 0.03, 0.04); o.connect(g).connect(master); o.start(t); o.stop(t + 0.08);
    },

    /* Keuze bevestigd */
    pick() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [523.3, 784].forEach((fr, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = fr;
        env(g, t + i * 0.07, 0.01, 0.12, 0.35); o.connect(g).connect(master); o.start(t + i * 0.07); o.stop(t + 0.6);
      });
    },

    /* Brekend glas */
    glass() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      n.buffer = noiseBuffer(0.8); f.type = "highpass"; f.frequency.value = 2500;
      env(g, t, 0.003, 0.5, 0.5); n.connect(f).connect(g).connect(master); n.start(t);
      for (let i = 0; i < 9; i++) {
        const o = ctx.createOscillator(), og = ctx.createGain(), tt = t + Math.random() * 0.5;
        o.type = "sine"; o.frequency.value = 2500 + Math.random() * 4500;
        env(og, tt, 0.001, 0.08, 0.2 + Math.random() * 0.3); o.connect(og).connect(master); o.start(tt); o.stop(tt + 0.7);
      }
    },

    /* Einde-akkoord */
    ending() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      [130.8, 196, 261.6, 329.6, 392].forEach((fr, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i ? "triangle" : "sine"; o.frequency.value = fr;
        env(g, t + i * 0.05, 0.4, 0.09, 3); o.connect(g).connect(master); o.start(t); o.stop(t + 4);
      });
    },

    /* Achtergrondsfeer per serie. theme: rookie | stranger | romance | ... */
    startPad(theme, musicUrl) {
      this.stopPad();
      if (musicUrl) {
        musicEl = new Audio(musicUrl);
        musicEl.loop = true; musicEl.volume = 0.22; musicEl.muted = muted;
        musicEl.addEventListener("error", () => { musicEl = null; this._synthPad(theme); }, { once: true });
        musicEl.play().catch(() => { musicEl = null; this._synthPad(theme); });
        return;
      }
      this._synthPad(theme);
    },
    _synthPad(theme) {
      if (!ensure()) return;
      const chords = {
        rookie: [65.4, 98, 155.6, 196],        // C mineur, spanning
        stranger: [55, 82.4, 130.8, 164.8],
        romance: [87.3, 130.8, 174.6, 220],    // F majeur, warm
        default: [73.4, 110, 146.8, 174.6]
      };
      const notes = chords[theme] || chords.default;
      const out = ctx.createGain(); out.gain.value = 0.0001;
      out.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 3);
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700; f.Q.value = 2;
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 0.07; lg.gain.value = 350; lfo.connect(lg).connect(f.frequency); lfo.start();
      f.connect(out).connect(master);
      const oscs = [];
      notes.forEach((fr, i) => {
        [-8, 7].forEach(det => {
          const o = ctx.createOscillator(); o.type = i === 0 ? "sine" : "sawtooth";
          o.frequency.value = fr; o.detune.value = det; o.connect(f); o.start(); oscs.push(o);
        });
      });
      padNodes = { out, oscs, lfo };
      if (theme === "stranger") this._arp([220, 261.6, 329.6, 392, 329.6, 261.6]);
    },
    _arp(seq) {
      let i = 0;
      arpTimer = setInterval(() => {
        if (!ctx) return;
        const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = "sawtooth"; o.frequency.value = seq[i++ % seq.length];
        f.type = "lowpass"; f.frequency.value = 1400;
        env(g, t, 0.005, 0.035, 0.22); o.connect(f).connect(g).connect(master); o.start(t); o.stop(t + 0.3);
      }, 190);
    },
    stopPad() {
      if (arpTimer) { clearInterval(arpTimer); arpTimer = null; }
      if (musicEl) { musicEl.pause(); musicEl = null; }
      if (padNodes && ctx) {
        const { out, oscs, lfo } = padNodes, t = ctx.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
        out.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        setTimeout(() => { oscs.forEach(o => { try { o.stop(); } catch (e) {} }); try { lfo.stop(); } catch (e) {} }, 1400);
        padNodes = null;
      }
    },
    duck(on) {
      if (padNodes && ctx) padNodes.out.gain.setTargetAtTime(on ? 0.018 : 0.05, ctx.currentTime, 0.3);
      if (musicEl) musicEl.volume = on ? 0.1 : 0.22;
    }
  };

  window.Sound = S;
  // Browsers staan geluid pas toe na een tik; ontgrendel bij de eerste aanraking.
  ["pointerdown", "keydown"].forEach(ev => window.addEventListener(ev, () => S.unlock(), { once: true, passive: true }));
})();
