// Schermen: splash + intro, "Wie kijkt er?", home en seriepagina.
import { store } from './store.js';
import { loadEpisode, directorsCutUnlocked, directorsCutSeries, visibleSeries } from './data.js';
import * as sound from './sound.js';
import { esc, fromHTML, icon, artHTML, avatarHTML, titleHTML, starsHTML, toast, enterFullscreenOnMobile } from './ui.js';

const go = (hash) => { location.hash = hash; };

// ===================================================================
// Splash ("tik om te starten") + intro-animatie
// ===================================================================
export function renderSplash(app, { next = '#/profielen' } = {}) {
  const el = fromHTML(`<div class="splash view" role="button" tabindex="0" aria-label="Tik om Marcelflix te starten">
    <div class="splash-inner">
      <div class="logo">Marcelflix</div>
      <div class="splash-paw">${icon.paw}</div>
      <div class="splash-hint">Tik om te starten</div>
    </div>
  </div>`);
  app.replaceChildren(el);
  el.focus({ preventScroll: true });
  const start = () => {
    el.removeEventListener('click', start);
    sound.unlock();
    playIntro(app, next);
  };
  el.addEventListener('click', start);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') start(); });
}

function playIntro(app, next) {
  const word = 'MARCELFLIX';
  const letters = [...word].map((c, i) => `<span style="animation-delay:${(i * 0.06).toFixed(2)}s">${c}</span>`).join('');
  const el = fromHTML(`<div class="intro">
    <div class="intro-beam"></div>
    <div class="intro-logo" aria-label="Marcelflix">${letters}</div>
    <button class="intro-skip">Overslaan</button>
  </div>`);
  app.replaceChildren(el);

  // Eigen intro-geluid? Zet assets/intro.mp3 in de map, anders wordt het gesynthetiseerd.
  const custom = new Audio('assets/intro.mp3');
  let usedCustom = false;
  custom.addEventListener('canplaythrough', () => {
    if (usedCustom) return;
    usedCustom = true;
    custom.muted = sound.isMuted();
    custom.play().catch(() => sound.tadum());
  }, { once: true });
  const synthTimer = setTimeout(() => { if (!usedCustom) { usedCustom = true; sound.tadum(); } }, 280);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    clearTimeout(synthTimer);
    go(next);
  };
  const timer = setTimeout(finish, 3500);
  el.querySelector('.intro-skip').addEventListener('click', (e) => { e.stopPropagation(); custom.pause(); finish(); });
}

// ===================================================================
// Wie kijkt er?
// ===================================================================
export function renderProfiles(app, site) {
  const el = fromHTML(`<main class="profiles view">
    <div class="profiles-top"><div class="logo">Marcelflix</div></div>
    <div>
      <h1>Wie kijkt er?</h1>
      <ul class="profile-list">
        ${site.profiles.map((p) => `<li><button class="profile" data-id="${esc(p.id)}">
          <div class="avatar">${avatarHTML(p)}</div>
          <div class="profile-name">${esc(p.name)}</div>
        </button></li>`).join('')}
      </ul>
      <button class="profiles-manage">Profielen beheren</button>
    </div>
  </main>`);
  app.replaceChildren(el);

  el.querySelectorAll('.profile').forEach((b) => b.addEventListener('click', () => {
    sound.unlock();
    sound.select();
    const id = b.dataset.id;
    store.setProfile(id);
    b.classList.add('chosen');
    if (id === 'marcel') toast('Marcel kijkt niet. Marcel wórdt bekeken.', 3600);
    setTimeout(() => go('#/home'), 450);
  }));
  el.querySelector('.profiles-manage').addEventListener('click', () => toast('Enkel Marcel mag profielen beheren. Marcel heeft geen duimen.'));
}

// ===================================================================
// Home
// ===================================================================
function header(site, active = 'home') {
  const me = site.profiles.find((p) => p.id === store.profile) || site.profiles[0];
  return `<header class="header">
    <a href="#/home" class="logo" aria-label="Marcelflix home">Marcelflix</a>
    <nav>
      <a href="#/home" class="${active === 'home' ? 'active' : ''}">Home</a>
      <a href="#/home" data-scroll="originals">Series</a>
      <a href="#/home" data-scroll="top10">Top 10</a>
    </nav>
    <div class="spacer"></div>
    <a href="#/profielen" class="me" aria-label="Wissel van profiel (${esc(me.name)})">${avatarHTML(me)}</a>
  </header>`;
}

/** Waar starten we als je op "Afspelen" drukt voor een serie? */
export function playTarget(series) {
  const eps = series.episodes.filter((e) => e.available);
  if (!eps.length) return null;
  const inProgress = eps.find((e) => { const p = store.episode(e.key); return p.lastScene && !p.finished; });
  if (inProgress) return { ep: inProgress, resume: true };
  const unwatched = eps.find((e) => !store.episode(e.key).finished);
  return { ep: unwatched || eps[0], resume: false };
}

function playHash(series, ep, resume) {
  return `#/kijk/${series.id}/${ep.id}${resume ? '?verder=1' : ''}`;
}

function continueItems(site) {
  const items = [];
  for (const s of visibleSeries(site)) {
    for (const e of s.episodes) {
      const p = store.episode(e.key);
      if (e.available && p.lastScene && !p.finished) items.push({ s, e, p });
    }
  }
  return items.sort((a, b) => b.p.updated - a.p.updated);
}

function card(s, { badge = null, progress = null, sub = null, href = null, cls = '' } = {}) {
  const soon = !s.playable;
  const b = badge ?? (soon ? 'Binnenkort' : null);
  return `<a class="card ${cls}" href="${href || `#/serie/${s.id}`}" aria-label="${esc(s.title)}">
    ${artHTML(s)}
    ${b ? `<span class="card-badge ${soon && !badge ? 'soon' : ''}">${esc(b)}</span>` : ''}
    ${progress != null ? `<div class="card-progress"><i style="width:${Math.round(progress * 100)}%"></i></div>` : ''}
    ${sub ? `<div class="card-meta">${sub}</div>` : ''}
  </a>`;
}

function row(title, inner, id = '') {
  return `<section class="row" ${id ? `id="${id}"` : ''}><h2>${esc(title)}</h2><div class="row-track">${inner}</div></section>`;
}

export function renderHome(app, site) {
  const dcUnlocked = directorsCutUnlocked(site);
  const dc = directorsCutSeries(site);
  const series = visibleSeries(site);
  const byId = (id) => site.seriesMap.get(id);

  // Uitgelicht: de Director's Cut zodra die ontgrendeld en nog niet bekeken is.
  let featured = byId(site.featured) || series[0];
  if (dcUnlocked && dc && !dc.episodes.every((e) => store.episode(e.key).finished)) featured = dc;
  const target = playTarget(featured);
  const review = (featured.reviews || [])[0];
  const topRank = (site.top10 || []).indexOf(featured.id);

  const cont = continueItems(site);
  const top10 = (site.top10 || []).map(byId).filter((s) => s && series.includes(s));
  const fresh = (site.new || []).map(byId).filter((s) => s && series.includes(s));
  const originals = series.filter((s) => !s.hidden);

  const dcCard = dc && !dcUnlocked
    ? `<button class="card card-locked" data-locked aria-label="Vergrendelde aflevering">
        ${artHTML({ ...dc, title: '???', poster: null })}
        <div class="card-lock">${icon.lock}<span>Kijk alle afleveringen<br>om dit te ontgrendelen</span></div>
      </button>`
    : '';

  const el = fromHTML(`<div class="home view">
    ${header(site)}
    <section class="hero">
      <div class="hero-art">${artHTML(featured, { image: featured.backdrop ? featured.base + featured.backdrop : undefined, title: false, mark: false })}</div>
      <div class="hero-content theme-${esc(featured.theme)}">
        <div class="hero-kicker"><span class="logo">M</span> ${featured.hidden ? 'Ontgrendeld' : 'Serie'}</div>
        <h1 class="hero-title t-title" style="font-size:clamp(40px, 7vw, 96px)">${titleHTML(featured.title)}</h1>
        ${topRank >= 0 ? `<div class="hero-top10"><span class="top10-badge">TOP<b>10</b></span> Nr. ${topRank + 1} in België vandaag</div>` : ''}
        <p class="hero-desc">${esc(featured.tagline || featured.description)}</p>
        <div class="hero-actions">
          ${target
            ? `<a class="btn btn-play" data-play href="${playHash(featured, target.ep, target.resume)}">${icon.play}<span>${target.resume ? 'Verder kijken' : 'Afspelen'}</span></a>`
            : '<span class="btn btn-play" aria-disabled="true" style="opacity:.6">Binnenkort</span>'}
          <a class="btn btn-info" href="#/serie/${featured.id}">${icon.info}<span>Meer info</span></a>
        </div>
        ${review ? `<div class="hero-review">${starsHTML(review.score)} <q>${esc(review.quote)}</q> <span>— ${esc(review.source)}</span></div>` : ''}
      </div>
    </section>
    <div class="rows">
      ${cont.length ? row('Verder kijken', cont.map(({ s, e, p }) => card(s, {
        href: playHash(s, e, true),
        badge: null,
        progress: Math.min(0.92, Math.max(0.08, (p.history?.length || 1) / 9)),
        sub: `<b>A${e.number}: ${esc(e.title)}</b>${esc(s.title)}`,
      })).join('')) : ''}
      ${row('Top 10 in België vandaag', top10.map((s, i) => `<div class="top10"><span class="top10-n" aria-hidden="true">${i + 1}</span>
        <a class="card" href="#/serie/${s.id}" aria-label="Nr. ${i + 1}: ${esc(s.title)}">${artHTML(s, { tall: true })}</a></div>`).join(''), 'top10')}
      ${row('Nieuw op Marcelflix', fresh.map((s) => card(s, { badge: s.playable ? 'Nieuwe aflevering' : null })).join(''))}
      ${row('Marcel Originals', originals.map((s) => card(s)).join('') + dcCard, 'originals')}
      ${dcUnlocked && dc ? row('Speciaal voor jou', card(dc, { badge: 'Ontgrendeld' })) : ''}
      ${row('Omdat je naar Marcel keek', [...originals].reverse().map((s) => card(s)).join(''))}
    </div>
    <footer class="footer">
      <p>Marcelflix is een productie van Marcel. Alle rechten voorbehouden aan Marcel.</p>
      <p>Geen enkele stofzuiger werd blijvend beschadigd tijdens de opnames.</p>
      <p><button data-reset>Voortgang wissen</button></p>
    </footer>
  </div>`);
  app.replaceChildren(el);

  const hdr = el.querySelector('.header');
  const onScroll = () => hdr.classList.toggle('solid', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  el.querySelectorAll('[data-play]').forEach((a) => a.addEventListener('click', () => { sound.unlock(); enterFullscreenOnMobile(); }));
  el.querySelectorAll('.card').forEach((a) => a.addEventListener('click', () => sound.click()));
  el.querySelector('[data-locked]')?.addEventListener('click', () => toast('Vergrendeld. Kijk eerst alle afleveringen. Marcel wacht.'));
  el.querySelectorAll('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById(a.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  el.querySelector('[data-reset]').addEventListener('click', () => {
    if (confirm('Alle voortgang en gevonden eindes wissen?')) {
      store.reset();
      go('#/profielen');
    }
  });

  if (dcUnlocked && !store.flag('dcAnnounced')) {
    store.setFlag('dcAnnounced');
    setTimeout(() => toast('🔓 Er is iets ontgrendeld. Kijk eens bij "Speciaal voor jou".', 5000), 900);
  }

  return () => window.removeEventListener('scroll', onScroll);
}

// ===================================================================
// Seriepagina
// ===================================================================
export function renderSeries(app, site, series) {
  const target = playTarget(series);
  const playLabel = !target ? 'Binnenkort' : target.resume ? 'Hervatten' : store.episode(target.ep.key).finished ? 'Opnieuw kijken' : 'Afspelen';
  const eps = series.episodes;

  const el = fromHTML(`<div class="series-page view">
    <a class="round-btn series-back" href="#/home" aria-label="Terug">${icon.back}</a>
    <div class="series-hero">${artHTML(series, { image: series.backdrop ? series.base + series.backdrop : undefined, title: false })}</div>
    <div class="series-body theme-${esc(series.theme)}">
      <h1 class="series-title t-title">${titleHTML(series.title)}</h1>
      <div class="meta">
        <span class="match">${esc(series.match || '98%')} match</span>
        <span>${esc(series.year || '')}</span>
        <span class="chip">${esc(series.age || '7+')}</span>
        <span>${esc(series.seasons || '1 seizoen')}</span>
        <span class="chip">HD</span>
        <span class="chip">Interactief</span>
      </div>
      <div class="series-actions">
        ${target
          ? `<a class="btn btn-play" data-play href="${playHash(series, target.ep, target.resume)}">${icon.play}<span>${playLabel}</span></a>`
          : `<span class="btn btn-play" aria-disabled="true" style="opacity:.6">Binnenkort</span>`}
        <button class="round-btn" data-joke="list" aria-label="Mijn lijst">${icon.plus}</button>
        <button class="round-btn" data-joke="like" aria-label="Duim omhoog">${icon.thumb}</button>
      </div>
      <div class="series-grid">
        <p class="series-desc">${esc(series.description)}</p>
        <div class="series-facts">
          <div>Met: <span>${esc(series.cast || 'Marcel')}</span></div>
          <div>Genres: <span>${esc((series.genres || []).join(', '))}</span></div>
          <div>Bedenker: <span>${esc(series.creator || 'Marcel')}</span></div>
        </div>
      </div>

      ${(series.reviews || []).length ? `<h2 class="section-h">Wat de pers zegt</h2>
      <div class="reviews">${series.reviews.map((r) => `<figure class="review" style="margin:0">
        ${starsHTML(r.score)} <b style="margin-left:6px">${esc(r.score)}</b>
        <q style="margin-top:8px">${esc(r.quote)}</q>
        <figcaption class="src">— ${esc(r.source)}</figcaption>
      </figure>`).join('')}</div>` : ''}

      <h2 class="section-h">Afleveringen <small>Seizoen 1</small></h2>
      <ol class="episodes">
        ${eps.map((e) => {
          const p = store.episode(e.key);
          const inner = `
            <span class="episode-n">${e.number}</span>
            <div class="episode-thumb">${artHTML(series, { image: e.available ? `${e.base}${e.thumb || 's01.jpg'}` : null, title: false })}
              ${e.available ? `<span class="play-ico">${icon.play}</span>` : ''}</div>
            <div class="episode-head"><span>${e.number}. ${esc(e.title)}</span><span class="dur">${esc(e.duration || '')}</span></div>
            <div class="episode-body">
              <p class="episode-desc">${esc(e.description || '')}</p>
              ${e.available ? `<span class="ends" data-ends="${esc(e.id)}"></span>` : '<span class="soon-chip">Binnenkort</span>'}
              ${p.lastScene && !p.finished ? '<span class="soon-chip" style="background:var(--red)">Bezig</span>' : ''}
            </div>`;
          return `<li>${e.available
            ? `<button class="episode" data-ep="${esc(e.id)}">${inner}</button>`
            : `<div class="episode is-soon">${inner}</div>`}</li>`;
        }).join('')}
      </ol>
    </div>
    <footer class="footer"><p>Marcelflix Original. Gemaakt met liefde, brokjes en veel te veel tijd.</p></footer>
  </div>`);
  app.replaceChildren(el);
  window.scrollTo(0, 0);

  el.querySelectorAll('[data-play]').forEach((a) => a.addEventListener('click', () => { sound.unlock(); enterFullscreenOnMobile(); }));
  el.querySelectorAll('[data-ep]').forEach((b) => b.addEventListener('click', () => {
    sound.unlock();
    enterFullscreenOnMobile();
    const e = eps.find((x) => x.id === b.dataset.ep);
    const p = store.episode(e.key);
    go(playHash(series, e, p.lastScene && !p.finished));
  }));
  el.querySelector('[data-joke="list"]').addEventListener('click', () => toast('Toegevoegd aan Mijn lijst. Marcel had het al in zijn lijst.'));
  el.querySelector('[data-joke="like"]').addEventListener('click', () => toast('Marcel heeft je duim gezien. Marcel is niet onder de indruk.'));

  // Aantal gevonden eindes per aflevering (laadt de episode.json's).
  el.querySelectorAll('[data-ends]').forEach(async (span) => {
    const meta = eps.find((x) => x.id === span.dataset.ends);
    try {
      const ep = await loadEpisode(series, meta.id);
      if (!ep.endings.length) return;
      const found = store.episode(meta.key).endings || [];
      const n = ep.endings.filter((x) => found.includes(x.title)).length;
      span.innerHTML = `<span class="ends-dots">${ep.endings.map((x) => `<i class="${found.includes(x.title) ? 'on' : ''}"></i>`).join('')}</span> ${n}/${ep.endings.length} eindes gevonden`;
    } catch (err) {
      span.textContent = '⚠ episode.json kon niet geladen worden';
    }
  });
}
