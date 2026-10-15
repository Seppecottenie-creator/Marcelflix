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
    get debug() { return { ctx, master, mood: curMood && curMood.name }; },
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
        amigos: [73.4, 110, 146.8, 185],       // D majeur, avontuurlijk
        default: [73.4, 110, 146.8, 174.6]
      };
      const notes = chords[theme] || chords.default;
      const out = ctx.createGain(); out.gain.value = 0.0001;
      out.gain.exponentialRampToValueAtTime(0.022, ctx.currentTime + 3);
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
    stopPad(keepMood) {
      if (!keepMood && curMood) this.stopMood();
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
      ducked = on;
      if (padNodes && ctx) padNodes.out.gain.setTargetAtTime(on ? 0.009 : 0.022, ctx.currentTime, 0.3);
      if (musicEl) musicEl.volume = on ? 0.1 : 0.22;
      if (moodBus && ctx) moodBus.gain.setTargetAtTime(MOOD_LEVEL * (on ? 0.5 : 1), ctx.currentTime, 0.4);
    },

    /* ---------- Muziek per stemming ("mood" per scène) ----------
       Elke stemming is een klein, zelf gespeeld deuntje (akkoorden + motiefje).
       Bij een andere stemming vloeit het oude deuntje in ~4 s over in het nieuwe. */
    setMood(name) {
      if (!ensure()) return;
      const def = MOODS[name] || MOODS.thuis;
      if (curMood && curMood.name === name) return;
      this.stopPad(true);
      if (!moodBus) { moodBus = ctx.createGain(); moodBus.gain.value = MOOD_LEVEL * (ducked ? 0.5 : 1); moodBus.connect(master); }
      const t = ctx.currentTime, old = curMood;
      if (old) {
        old.out.gain.cancelScheduledValues(t);
        old.out.gain.setValueAtTime(Math.max(old.out.gain.value, 0.0001), t);
        old.out.gain.linearRampToValueAtTime(0.0001, t + XFADE);
        setTimeout(() => { clearInterval(old.timer); try { old.out.disconnect(); } catch (e) {} }, XFADE * 1000 + 600);
      }
      const out = ctx.createGain(); out.gain.value = 0.0001;
      out.gain.linearRampToValueAtTime(def.vol || 0.06, t + (old ? XFADE : 2.5));
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = def.cutoff || 2400; f.Q.value = 0.7;
      f.connect(out).connect(moodBus);
      const m = { name, out, bus: f, step: 0, next: t + 0.1, def };
      const spb = 60 / def.bpm / 2;              // achtste noten
      m.timer = setInterval(() => {
        if (!ctx) return;
        while (m.next < ctx.currentTime + 0.25) {
          const bar = Math.floor(m.step / 8), chord = def.chords[bar % def.chords.length];
          def.play(m, m.next, m.step % 8, chord, spb);
          m.step++; m.next += spb;
        }
      }, 80);
      curMood = m;
    },
    stopMood() {
      if (!curMood || !ctx) return;
      const m = curMood, t = ctx.currentTime; curMood = null;
      m.out.gain.cancelScheduledValues(t);
      m.out.gain.setValueAtTime(Math.max(m.out.gain.value, 0.0001), t);
      m.out.gain.linearRampToValueAtTime(0.0001, t + 1.5);
      setTimeout(() => { clearInterval(m.timer); try { m.out.disconnect(); } catch (e) {} }, 2000);
    }
  };

  /* ---------- instrumentjes voor de stemmingen ---------- */
  const XFADE = 4;
  const MOOD_LEVEL = 8;   // totaalvolume van de stemmingsmuziek (ruim onder de stem)
  let moodBus = null, curMood = null, ducked = false;
  const N = (semi) => 440 * Math.pow(2, (semi - 9) / 12);   // semi 0 = C4
  function tone(dest, t, freq, dur, { type = "triangle", vol = 0.2, a = 0.01, rel = null, detune = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + (rel ?? dur));
    o.connect(g).connect(dest); o.start(t); o.stop(t + a + (rel ?? dur) + 0.05);
  }
  function bell(dest, t, freq, vol = 0.12, len = 1.6) {
    tone(dest, t, freq, len, { type: "sine", vol, a: 0.005 });
    tone(dest, t, freq * 2.01, len * 0.5, { type: "sine", vol: vol * 0.35, a: 0.005 });
  }
  function padChord(dest, t, notes, len, vol = 0.05, type = "sawtooth") {
    notes.forEach((n, i) => [-6, 6].forEach(d => tone(dest, t, N(n), len, { type: i ? type : "sine", vol: vol / notes.length * 2, a: len * 0.35, rel: len * 0.75, detune: d })));
  }
  function thump(dest, t, freq = 70, vol = 0.35, len = 0.35) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(freq * 1.6, t); o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(dest); o.start(t); o.stop(t + len + 0.05);
  }
  // akkoorden als halve tonen t.o.v. C4 (wortel eerst)
  const MOODS = {
    thuis: { bpm: 76, vol: 0.07, cutoff: 2600,                 // warm speeldoosje, F groot
      chords: [[-7, 9, 12, 16], [-10, 5, 9, 14], [-14, 5, 10, 14], [-12, 4, 7, 12]],
      play(m, t, s, c, spb) {
        if (s === 0) { padChord(m.bus, t, c.slice(1).map(n => n - 12), spb * 8, 0.035, "triangle"); tone(m.bus, t, N(c[0]), spb * 6, { type: "sine", vol: 0.12, a: 0.05 }); }
        const arp = [1, 2, 3, 2, 1, 2, 3, 2][s]; bell(m.bus, t, N(c[arp] + 12), s % 2 ? 0.035 : 0.06, 1.2);
      } },
    magie: { bpm: 104, vol: 0.065, cutoff: 5200,               // fonkelende celesta, D groot / B klein
      chords: [[-10, 14, 18, 21], [-13, 11, 14, 18], [-17, 7, 11, 14], [-15, 9, 13, 16]],
      play(m, t, s, c, spb) {
        if (s === 0) { padChord(m.bus, t, c.slice(1).map(n => n - 12), spb * 8, 0.04, "triangle"); tone(m.bus, t, N(c[0]), spb * 7, { type: "sine", vol: 0.1, a: 0.1 }); }
        const arp = [1, 2, 3, 2, 3, 1, 3, 2][s]; bell(m.bus, t, N(c[arp] + 12 * (s > 3 ? 2 : 1)), 0.05, 1.5);
        if (s === 6 && Math.random() < 0.6) bell(m.bus, t + spb / 2, N(c[3] + 24), 0.025, 2);
      } },
    mysterie: { bpm: 60, vol: 0.14, cutoff: 1500,             // trage, mysterieuze mineur, A klein
      chords: [[-15, 9, 12, 16], [-19, 5, 9, 12], [-22, 2, 5, 9], [-20, 4, 8, 11]],
      play(m, t, s, c, spb) {
        if (s === 0) { padChord(m.bus, t, c.slice(1).map(n => n - 12), spb * 8, 0.06); tone(m.bus, t, N(c[0]), spb * 8, { type: "sine", vol: 0.14, a: 0.6 }); }
        if (s === 3 || (s === 6 && Math.random() < 0.5)) bell(m.bus, t, N(c[1 + (m.step % 3)] + 12), 0.045, 2.6);
      } },
    avontuur: { bpm: 122, vol: 0.06, cutoff: 3000,             // stuwende ostinato, D klein
      chords: [[-22, 2, 5, 9], [-26, -2, 2, 5], [-24, 0, 4, 7], [-27, 1, 4, 9]],
      play(m, t, s, c, spb) {
        tone(m.bus, t, N(c[0]), spb * 0.8, { type: "sawtooth", vol: 0.07, a: 0.005, rel: spb * 0.7 });
        tone(m.bus, t, N(c[0] + 12), spb * 0.6, { type: "triangle", vol: 0.05, a: 0.005, rel: spb * 0.5 });
        if (s % 2 === 0) tone(m.bus, t, N(c[[1, 2, 3, 2][s / 2]] + 12), spb * 0.9, { type: "sawtooth", vol: 0.035, a: 0.01, rel: spb * 0.8 });
        if (s === 0 || s === 4) thump(m.bus, t, 62, 0.3);
        if (s === 0) padChord(m.bus, t, c.slice(1), spb * 8, 0.03);
      } },
    gevaar: { bpm: 92, vol: 0.075, cutoff: 1300,               // laag, dreigend, hartslag, C klein
      chords: [[-24, 0, 3, 7], [-28, -4, 0, 3], [-29, -5, -2, 2], [-24, 0, 3, 6]],
      play(m, t, s, c, spb) {
        if (s === 0) { padChord(m.bus, t, c.slice(1).map(n => n - 12), spb * 8, 0.07); tone(m.bus, t, N(c[0]), spb * 8, { type: "sawtooth", vol: 0.06, a: 0.3, detune: -8 }); }
        if (s === 0 || s === 1) thump(m.bus, t, 55, s ? 0.12 : 0.18, 0.3);
        tone(m.bus, t, N(c[2]), spb * 0.5, { type: "triangle", vol: 0.02, a: 0.01, rel: spb * 0.45 });
      } },
    grappig: { bpm: 112, vol: 0.2, cutoff: 3600,              // huppelende pizzicato, C groot
      chords: [[-24, 4, 7, 12], [-29, 2, 7, 11], [-27, 0, 4, 9], [-29, 2, 7, 11]],
      play(m, t, s, c, spb) {
        if (s % 4 === 0) tone(m.bus, t, N(c[0]), spb * 0.6, { type: "triangle", vol: 0.13, a: 0.005, rel: spb * 0.5 });
        if (s % 4 === 2) [1, 2].forEach(i => tone(m.bus, t, N(c[i]), spb * 0.4, { type: "triangle", vol: 0.05, a: 0.005, rel: spb * 0.35 }));
        if ([0, 3, 5, 6].includes(s)) tone(m.bus, t, N(c[[3, 2, 3, 1][[0, 3, 5, 6].indexOf(s)]] + 12), spb * 0.4, { type: "square", vol: 0.018, a: 0.005, rel: spb * 0.3 });
      } },
    triomf: { bpm: 96, vol: 0.055, cutoff: 3200,                // feestelijke fanfare, C groot
      chords: [[-24, 4, 7, 12], [-19, 5, 9, 12], [-17, 7, 11, 14], [-24, 4, 7, 12]],
      play(m, t, s, c, spb) {
        if (s === 0) { padChord(m.bus, t, c.slice(1), spb * 8, 0.06); thump(m.bus, t, 80, 0.16, 0.6); tone(m.bus, t, N(c[0]), spb * 7, { type: "sawtooth", vol: 0.05, a: 0.05 }); }
        if (s === 4) thump(m.bus, t, 80, 0.1, 0.5);
        if (s === 6 || s === 7) tone(m.bus, t, N(c[s === 6 ? 2 : 3] + 12), spb * 0.8, { type: "sawtooth", vol: 0.03, a: 0.02, rel: spb * 0.7 });
        bell(m.bus, t, N(c[1 + (s % 3)] + 24), 0.02, 0.8);
      } }
  };

  window.Sound = S;
  // Browsers staan geluid pas toe na een tik; ontgrendel bij de eerste aanraking.
  ["pointerdown", "keydown"].forEach(ev => window.addEventListener(ev, () => S.unlock(), { once: true, passive: true }));
})();
