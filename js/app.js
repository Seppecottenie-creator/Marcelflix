/* Marcelflix — app: intro, profielen, home, seriepagina, routing */
(function () {
  "use strict";
  const app = document.getElementById("app");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let CONFIG = null, CATALOG = [], player = null;

  /* ---------- opslag (per toestel) ---------- */
  const Store = {
    key: "marcelflix:v1",
    d: { profile: null, endings: {}, cont: {}, watched: {}, remind: {} },
    load() { try { const x = JSON.parse(localStorage.getItem(this.key)); if (x) Object.assign(this.d, x); } catch (e) {} },
    save() { try { localStorage.setItem(this.key, JSON.stringify(this.d)); } catch (e) {} },
    k(s, e) { return s + "/" + e; },
    endings(s, e) { return this.d.endings[this.k(s, e)] || []; },
    addEnding(s, e, id) {
      const list = this.endings(s, e);
      if (list.includes(id)) return false;
      this.d.endings[this.k(s, e)] = [...list, id]; this.save(); return true;
    },
    setContinue(s, e, scene, step) { this.d.cont[this.k(s, e)] = { scene, step, at: Date.now() }; this.save(); },
    clearContinue(s, e) { delete this.d.cont[this.k(s, e)]; this.save(); },
    markWatched(s, e) { this.d.watched[this.k(s, e)] = true; this.save(); }
  };

  /* ---------- helpers ---------- */
  function toast(msg, ms = 2800) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("on");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), ms);
  }
  const byId = (id) => CATALOG.find(s => s.id === id);
  const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

  function isUnlocked(s) {
    if (s.status !== "secret") return true;
    const u = s.unlock || {};
    return Store.endings(u.series, u.episode).length >= (u.endings || 1);
  }
  const visible = () => CATALOG.filter(s => s.status !== "secret" || isUnlocked(s));

  function slogo(s, extra = "") {
    const l = s.logoLine || [s.title];
    return `<h1 class="slogo ${esc(s.theme)} ${extra}"><span class="l1">${esc(l[0])}</span>${l[1] ? `<span class="l2">${esc(l[1])}</span>` : ""}</h1>`;
  }
  function posterHtml(s) {
    if (s.poster) return `<img src="${esc(s.poster)}" alt="" loading="lazy"><div class="gposter gp-img">${slogo(s)}</div>`;
    return `<div class="gposter gp-${esc(s.theme)}"><div class="art"></div>${slogo(s)}</div>`;
  }
  function ribbon(s) {
    if (s.status === "soon") return `<div class="ribbon soon">BINNENKORT</div>`;
    if (s.status === "secret") return `<div class="ribbon new"><span>GEHEIM</span></div>`;
    return `<div class="ribbon new"><span>NIEUWE AFLEVERING</span></div>`;
  }
  function currentProfile() { return CONFIG.profiles.find(p => p.id === Store.d.profile) || CONFIG.profiles[0]; }
  function avatarHtml(p) {
    return p.avatar ? `<img src="${esc(p.avatar)}" alt="">` : `<span class="face">😊</span>`;
  }

  /* ---------- views ---------- */
  function viewSplash() {
    app.innerHTML = `<div class="splash"><div>
        <div class="logo">MARCELFLIX</div>
        <p>Onbeperkt Marcel. Opzeggen kan niet.</p>
        <button class="btn-start" id="start">▶ Starten</button></div></div>`;
    document.getElementById("start").onclick = () => { MarcelPlayer.primeAudio(); viewIntro(); };
  }

  function viewIntro() {
    const letters = "MARCELFLIX".split("").map((c, i) => `<span style="animation-delay:${i * 0.06}s">${c}</span>`).join("");
    app.innerHTML = `<div class="intro" id="intro"><div class="beam"></div><div class="logo">${letters}</div></div>`;
    Sound.tadum();
    const el = document.getElementById("intro");
    let done = false;
    const finish = () => { if (done) return; done = true; go("#/profielen"); };
    setTimeout(() => el.classList.add("zoom"), 1700);
    setTimeout(finish, 3000);
    el.addEventListener("click", finish);
  }

  function viewProfiles() {
    app.innerHTML = `<div class="profiles">
      <h1>Wie kijkt er?</h1>
      <div class="profile-grid">${CONFIG.profiles.map(p => `
        <button class="profile" data-id="${esc(p.id)}">
          <div class="av" style="background:${esc(p.color)}">${avatarHtml(p)}${p.locked ? `<span class="lock">🔒</span>` : ""}</div>
          <span>${esc(p.name)}</span></button>`).join("")}
      </div>
      <button class="manage" id="manage">PROFIELEN BEHEREN</button></div>`;
    app.querySelectorAll(".profile").forEach(b => b.onclick = () => {
      const p = CONFIG.profiles.find(x => x.id === b.dataset.id);
      if (p.locked) { toast(p.locked, 3500); return; }
      Store.d.profile = p.id; Store.save(); go("#/home");
      if (p.welcome) setTimeout(() => toast(p.welcome, 3200), 400);
    });
    document.getElementById("manage").onclick = () => toast("Profielen worden beheerd door Marcel. Hij is niet bereikbaar.");
  }

  function topbar(active) {
    const p = currentProfile();
    return `<header class="topbar" id="topbar">
      <a href="#/home" class="logo" style="text-decoration:none">MARCELFLIX</a>
      <nav><a href="#/home" class="${active === "home" ? "on" : ""}">Home</a><a href="#/series" class="${active === "series" ? "on" : ""}">Series</a><a href="#/films" class="${active === "film" ? "on" : ""}">Films</a></nav>
      <div class="right">
        <button class="bell" id="bell" aria-label="Meldingen">🔔<span class="dot">1</span></button>
        <a href="#/profielen" class="mini-av" style="background:${esc(p.color)}" aria-label="Profiel wisselen">${avatarHtml(p)}</a>
      </div></header>`;
  }
  function wireTopbar() {
    const tb = document.getElementById("topbar");
    const onScroll = () => tb.classList.toggle("solid", scrollY > 40);
    window.onscroll = onScroll; onScroll();
    document.getElementById("bell").onclick = () => {
      const f = byId(CONFIG.featured);
      toast(`Nieuw: ${f.title}, aflevering 1 staat klaar. Marcel verwacht dat je kijkt.`, 3500);
    };
  }

  function viewHome() {
    const f = byId(CONFIG.featured);
    const vis = visible();
    const conts = Object.entries(Store.d.cont).map(([k, v]) => {
      const [sid, eid] = k.split("/"); const s = byId(sid); if (!s) return null;
      const ep = s.episodes.find(e => e.id === eid); return ep ? { s, ep, v } : null;
    }).filter(Boolean);
    const secret = CATALOG.filter(s => s.status === "secret" && isUnlocked(s));
    const pub = vis.filter(s => s.status !== "secret");
    const hasG = (s, list) => s.genres.some(g => list.includes(g));

    app.innerHTML = `${topbar("home")}
      <section class="hero">
        ${(f.backdrop || f.poster)
          ? `<div class="bd" style="background-image:url('${esc(f.backdrop || f.poster)}')"></div>`
          : `<div class="bd gp-${esc(f.theme)}"><div class="art" style="position:absolute;inset:0"></div></div>`}
        <div class="inner">
          <div class="badge-orig"><b>M</b> SERIE</div>
          ${slogo(f)}
          <div class="meta"><span class="match">${f.match}% match</span><span>${f.year}</span><span class="age">${esc(f.age)}</span><span>Nieuwe aflevering</span></div>
          <p class="desc">${esc(f.description)}</p>
          <div class="btns">
            <button class="btn play" data-play="${esc(f.id)}"><span class="ico">▶</span> ${conts.find(c => c.s.id === f.id) ? "Verder kijken" : "Afspelen"}</button>
            <button class="btn info" data-open="${esc(f.id)}"><span class="ico">ⓘ</span> Meer info</button>
          </div>
        </div>
      </section>
      <div class="rows">
        ${secret.length ? row("Speciaal voor jou 💘", secret.map(cardHtml).join("")) : ""}
        ${row("Verder kijken als " + esc(currentProfile().name),
          conts.map(c => `<button class="card wide" data-play="${esc(c.s.id)}" data-ep="${esc(c.ep.id)}">
              ${(c.ep.still || c.s.backdrop || c.s.poster)
                ? `<img src="${esc(c.ep.still || c.s.backdrop || c.s.poster)}" alt="" loading="lazy">`
                : `<span class="gposter gp-${esc(c.s.theme)}"><span class="art"></span></span>`}
              <div class="ctitle">${esc(c.s.title)} · A${c.ep.number}</div>
              <div class="progress"><i style="width:${Math.min(92, 8 + c.v.step * 6)}%"></i></div></button>`).join("") +
          `<button class="card wide" data-joke="slapen">
              <span class="gposter gp-romance"><span class="art"></span></span>
              <div class="ctitle">Marcel: Slapen · S14 A312</div>
              <div class="progress"><i style="width:97%"></i></div></button>`)}
        ${row(`<a href="#/series" class="rowlink">Marcelflix Originals: Series ›</a>`, pub.filter(s => s.type === "series").map(cardHtml).join(""))}
        ${row(`<a href="#/films" class="rowlink">Films ›</a>`, pub.filter(s => s.type === "film").map(cardHtml).join(""))}
        ${row("Spannend, met een kat erin", pub.filter(s => hasG(s, ["Thriller", "Misdaad", "Mysterie", "Heist", "Spionage"])).map(cardHtml).join(""))}
        ${row("Voor een romantische avond", pub.filter(s => hasG(s, ["Romantiek", "Kostuumdrama"])).map(cardHtml).join(""))}
        ${row("Omdat je keek naar: Marcel die naar de muur staart", pub.filter(s => hasG(s, ["Sci-fi", "Fantasy", "Superheld", "Historisch drama"])).reverse().map(cardHtml).join(""))}
      </div>
      <footer class="foot">Marcelflix · Een Marcel Productie<br>Geen enkele vaas werd beschadigd tijdens de opnames. Nou ja. Eén.<br>
        <a href="#" id="reset" style="color:#555">Voortgang wissen</a></footer>`;
    wireTopbar();
    wireCards();
    document.getElementById("reset").onclick = (e) => {
      e.preventDefault();
      if (confirm("Alle voortgang en gevonden eindes wissen?")) { Store.d.endings = {}; Store.d.cont = {}; Store.d.watched = {}; Store.save(); viewHome(); toast("Gewist. Marcel is alles vergeten. Behalve zijn eten."); }
    };
    scrollTo(0, 0);
  }
  function row(title, inner, cls = "") { return inner ? `<section class="row ${cls}"><h2>${title}</h2><div class="track">${inner}</div></section>` : ""; }
  function cardHtml(s) { return `<button class="card" data-open="${esc(s.id)}" aria-label="${esc(s.title)}"><span class="m">M</span>${posterHtml(s)}${s.type === "film" ? `<span class="type-tag">FILM</span>` : ""}${ribbon(s)}</button>`; }

  function viewBrowse(type, genre) {
    const list = visible().filter(s => s.type === type);
    const genres = [...new Set(list.flatMap(s => s.genres))].sort((a, b) => a.localeCompare(b, "nl"));
    const shown = genre ? list.filter(s => s.genres.includes(genre)) : list;
    const base = type === "film" ? "#/films" : "#/series";
    app.innerHTML = `${topbar(type)}
      <section class="browse">
        <h1>${type === "film" ? "Films" : "Series"}</h1>
        <div class="chips"><a class="chip ${genre ? "" : "on"}" href="${base}">Alle</a>${genres.map(g =>
          `<a class="chip ${g === genre ? "on" : ""}" href="${base}/${encodeURIComponent(g)}">${esc(g)}</a>`).join("")}</div>
        <div class="grid">${shown.map(cardHtml).join("")}</div>
      </section>
      <footer class="foot">Marcelflix · ${list.length} ${type === "film" ? "films" : "series"} · Allemaal met Marcel</footer>`;
    wireTopbar(); wireCards();
    if (!genre) scrollTo(0, 0);
  }

  function wireCards() {
    app.querySelectorAll("[data-open]").forEach(b => b.onclick = () => go("#/serie/" + b.dataset.open));
    app.querySelectorAll("[data-play]").forEach(b => b.onclick = () => {
      const s = byId(b.dataset.play);
      if (s.status === "soon") { go("#/serie/" + s.id); return; }
      MarcelPlayer.primeAudio();
      const eid = b.dataset.ep || s.episodes[0].id;
      pending = { key: s.id + "/" + eid, mode: Store.d.cont[s.id + "/" + eid] ? "resume" : "fresh", at: performance.now() };
      go("#/kijk/" + s.id + "/" + eid);
    });
    app.querySelectorAll("[data-joke]").forEach(b => b.onclick = () => toast("Deze aflevering duurt 16 uur per dag. Je zit er middenin.", 3500));
  }

  function viewSeries(id) {
    const s = byId(id);
    if (!s || !isUnlocked(s)) { toast("Deze titel bestaat niet. Of toch nog niet."); go("#/home"); return; }
    const soon = s.status === "soon";
    const ep0 = s.episodes[0];
    const found = ep0 ? Store.endings(s.id, ep0.id) : [];
    const reminded = Store.d.remind[s.id];
    app.innerHTML = `${topbar()}
      <div class="detail">
        <button class="back-btn" id="back" aria-label="Terug">←</button>
        <section class="hero">
          <div class="bd ${s.backdrop ? "" : "gp-" + esc(s.theme)}" ${s.backdrop ? `style="background-image:url('${esc(s.backdrop)}')"` : ""}>${s.backdrop ? "" : `<div class="art" style="position:absolute;inset:0"></div>`}</div>
          <div class="inner">
            <div class="badge-orig"><b>M</b> ${s.status === "secret" ? "GEHEIME FILM" : s.type === "film" ? "FILM" : "SERIE"}</div>
            ${slogo(s)}
            <div class="meta"><span class="match">${s.match}% match</span><span>${s.year}</span><span class="age">${esc(s.age)}</span>
              <span>${s.type === "film" ? "Film · " + esc(ep0.duration || "") : soon ? "Binnenkort" : s.episodes.length + " aflevering" + (s.episodes.length > 1 ? "en" : "")}</span>${s.type === "film" && soon ? "<span>Binnenkort</span>" : ""}<span class="hd">HD</span><span class="hd">MIAUW 5.1</span></div>
            <p class="desc" style="font-style:italic;margin-bottom:10px">${esc(s.tagline)}</p>
            <div class="btns">
              ${soon ? `<button class="btn play" id="remind">${reminded ? "✓ Je krijgt een melding" : "🔔 Herinner mij"}</button>`
                : `<button class="btn play" data-play="${esc(s.id)}"><span class="ico">▶</span> ${Store.d.cont[s.id + "/" + ep0.id] ? "Verder kijken" : "Afspelen"}</button>`}
              <button class="btn info" id="mylist">＋ Mijn lijst</button>
            </div>
          </div>
        </section>
        <div class="detail-body">
          <div>
            <p class="desc" style="line-height:1.55;font-size:16px;margin-top:0">${esc(s.description)}</p>
            ${!soon && found.length ? `<div class="facts"><b>Gevonden eindes</b></div><div class="endings">${found.map(e => `<span class="end-chip got">Einde ${esc(e)}</span>`).join("")}</div>` : ""}
            <h3 style="margin-top:26px">${s.type === "film" ? "Film" : "Afleveringen"}</h3>
            ${s.episodes.map(e => `<button class="ep" ${soon ? "data-soonep" : `data-play="${esc(s.id)}" data-ep="${esc(e.id)}"`}>
                <span class="n">${e.number}</span>
                <span class="still">${e.still ? `<img src="${esc(e.still)}" alt="" loading="lazy">` : `<span class="gposter gp-${esc(s.theme)}" style="padding:0"><span class="art"></span></span>`}<span class="pl">${soon ? "🔒" : "▶"}</span></span>
                <span class="txt"><h4>${esc(e.title)} <span>${esc(e.duration || "")}</span></h4><p>${esc(e.summary || "")}</p></span>
              </button>`).join("")}
          </div>
          <div>
            <div class="facts">
              ${s.cast ? `<div><b>Cast:</b> ${esc(s.cast)}</div>` : `<div><b>Cast:</b> Marcel</div>`}
              <div><b>Genres:</b> ${s.genres.map(esc).join(", ")}</div>
              <div><b>Deze serie is:</b> ${soon ? "Veelbelovend, Mysterieus" : "Interactief, Oordelend, Pluizig"}</div>
            </div>
            ${(s.reviews || []).length ? `<h3 style="margin-top:22px">Wat critici zeggen</h3>${s.reviews.map(r => `
              <div class="review"><div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div><q>${esc(r.text)}</q><small>— ${esc(r.who)}</small></div>`).join("")}` : ""}
          </div>
        </div>
      </div>
      <footer class="foot">Marcelflix · Een Marcel Productie</footer>`;
    wireTopbar(); wireCards();
    document.getElementById("back").onclick = () => history.length > 1 ? history.back() : go("#/home");
    document.getElementById("mylist").onclick = (e) => { e.currentTarget.textContent = "✓ In je lijst"; toast("Toegevoegd. Marcel staat trouwens standaard in je lijst."); };
    const rm = document.getElementById("remind");
    if (rm) rm.onclick = () => { Store.d.remind[s.id] = true; Store.save(); rm.textContent = "✓ Je krijgt een melding"; toast("Genoteerd. Marcel stuurt een duif."); };
    app.querySelectorAll("[data-soonep]").forEach(b => b.onclick = () => toast(s.type === "film" ? "Deze film wordt nog gedraaid. Marcel weigert te werken voor minder dan drie snoepjes per scène." : "Deze aflevering wordt nog opgenomen. Marcel is in onderhandeling over zijn gage (brokjes)."));
    scrollTo(0, 0);
  }

  function viewWatch(sid, eid, gate) {
    const s = byId(sid);
    const ep = s && s.episodes.find(e => e.id === eid);
    if (!s || !ep || s.status === "soon" || !isUnlocked(s)) { go("#/home"); return; }
    if (player) { player.exit(true); player = null; }
    const startPlayer = () => {
      const cont = Store.d.cont[sid + "/" + eid];
      player = new MarcelPlayer.Player({
        series: s, episodeId: eid, episodeNumber: ep.number,
        basePath: `series/${sid}/${eid}/`, store: Store, catalog: CATALOG,
        checkUnlock: () => CATALOG.find(x => x.status === "secret" && isUnlocked(x) && !Store.d.watched[x.id + "/" + x.episodes[0].id]) || null,
        onOpenSeries: (id) => { player = null; go("#/serie/" + id); },
        onExit: () => { player = null; go("#/serie/" + sid); }
      });
      player.start(cont && gate === "resume" ? cont.scene : undefined);
    };
    // Na een refresh moet je eerst tikken (anders blokkeert de browser het geluid)
    const cont = Store.d.cont[sid + "/" + eid];
    app.innerHTML = `<div class="splash"><div>${slogo(s)}<p>Aflevering ${ep.number} · ${esc(ep.title)}</p>
      <div class="btns" style="justify-content:center">
        ${cont ? `<button class="btn play" id="resume">▶ Verder kijken</button><button class="btn info" id="fresh">Vanaf het begin</button>`
               : `<button class="btn play" id="fresh">▶ Afspelen</button>`}
      </div><p style="margin-top:22px"><a href="#/serie/${esc(sid)}" style="color:#888">← Terug</a></p></div></div>`;
    const begin = (mode) => { MarcelPlayer.primeAudio(); gate = mode; if (mode === "fresh") Store.clearContinue(sid, eid); startPlayer(); };
    document.getElementById("fresh").onclick = () => begin("fresh");
    const r = document.getElementById("resume"); if (r) r.onclick = () => begin("resume");
    // Kwamen we via een klik op Afspelen binnen? Dan meteen starten.
    if (pending && pending.key === sid + "/" + eid && performance.now() - pending.at < 3000) { const m = pending.mode; pending = null; begin(m); }
  }
  let pending = null;

  /* ---------- router ---------- */
  function route() {
    window.onscroll = null;
    const hsh = location.hash.replace(/^#\/?/, "");
    const [view, a, b] = hsh.split("/");
    if (view !== "kijk" && player) { player.exit(true); player = null; }
    if (!view) return viewSplash();
    if (Store.d.profile && !CONFIG.profiles.some(p => p.id === Store.d.profile)) Store.d.profile = null;
    if (!Store.d.profile && view !== "profielen") return viewProfiles();
    if (view === "profielen") return viewProfiles();
    if (view === "home") return viewHome();
    if (view === "serie") return viewSeries(a);
    if (view === "series") return viewBrowse("series", a && decodeURIComponent(a));
    if (view === "films") return viewBrowse("film", a && decodeURIComponent(a));
    if (view === "kijk") return viewWatch(a, b);
    go("#/home");
  }

  async function boot() {
    app.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    Store.load();
    try {
      const [c, k] = await Promise.all([
        fetch("data/config.json", { cache: "no-cache" }).then(r => r.json()),
        fetch("data/catalog.json", { cache: "no-cache" }).then(r => r.json())
      ]);
      CONFIG = c; CATALOG = k.series;
    } catch (e) {
      app.innerHTML = `<div class="splash"><div><div class="logo">MARCELFLIX</div><p>Kon de data niet laden. Open de site via een webserver (bv. GitHub Pages), niet als los bestand.</p></div></div>`;
      return;
    }
    window.addEventListener("hashchange", route);
    route();
  }
  boot();
})();
