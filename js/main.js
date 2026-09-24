// Opstart + router (hash-routes, zodat alles werkt op GitHub Pages).
import { store } from './store.js';
import { loadSite, directorsCutUnlocked } from './data.js';
import * as sound from './sound.js';
import { esc, fromHTML } from './ui.js';
import { renderSplash, renderProfiles, renderHome, renderSeries } from './views.js';
import { renderPlayer } from './player.js';

const app = document.getElementById('app');
let cleanup = null;
let booted = false;
let routeToken = 0;

function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  const params = new URLSearchParams(query);
  return { parts: path.split('/').filter(Boolean), params };
}

function isDebug(params) {
  if (params.has('debug')) {
    try { localStorage.setItem('marcelflix.debug', params.get('debug') === '0' ? '0' : '1'); } catch (e) { /* */ }
  }
  try { return localStorage.getItem('marcelflix.debug') === '1'; } catch (e) { return false; }
}

async function route() {
  const token = ++routeToken;
  const { parts, params } = parseHash();
  let site;
  try {
    site = await loadSite();
  } catch (e) {
    showFatal(e);
    return;
  }
  if (token !== routeToken) return;

  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  window.scrollTo(0, 0);
  const [page, a, b, c] = parts;

  // Eerste bezoek van deze sessie op de startpagina: splash + intro.
  if (!page) {
    booted = true;
    renderSplash(app, { next: '#/profielen' });
    return;
  }
  booted = true;

  const needsProfile = ['home', 'serie', 'kijk'].includes(page);
  if (needsProfile && !site.profiles.some((p) => p.id === store.profile)) {
    location.replace('#/profielen');
    return;
  }

  switch (page) {
    case 'profielen':
      renderProfiles(app, site);
      break;
    case 'home':
      cleanup = renderHome(app, site) || null;
      break;
    case 'serie': {
      const s = site.seriesMap.get(a);
      if (!s || (s.hidden && !directorsCutUnlocked(site))) { location.replace('#/home'); return; }
      renderSeries(app, site, s);
      break;
    }
    case 'kijk': {
      const s = site.seriesMap.get(a);
      if (!s) { location.replace('#/home'); return; }
      const c2 = await renderPlayer(app, site, s, b, { scene: c, resume: params.has('verder'), debug: isDebug(params) });
      if (token !== routeToken) { c2(); return; }
      cleanup = c2;
      break;
    }
    default:
      location.replace('#/home');
  }
}

function showFatal(e) {
  const local = location.protocol === 'file:';
  app.replaceChildren(fromHTML(`<div class="profiles"><div style="max-width:640px;text-align:left">
    <div class="logo" style="font-size:48px;margin-bottom:20px">Marcelflix</div>
    <h1 style="font-size:24px">Marcelflix kon niet laden</h1>
    <pre style="white-space:pre-wrap;background:#1f1f1f;padding:12px;border-radius:6px">${esc(e.message)}</pre>
    ${local ? '<p>Je opende het bestand rechtstreeks. Start een lokale server in de projectmap:<br><code>python3 -m http.server 8000</code><br>en surf naar <code>http://localhost:8000</code>.</p>' : ''}
  </div></div>`));
}

window.addEventListener('hashchange', route);
// Elke eerste tik ontgrendelt geluid (nodig op gsm).
window.addEventListener('pointerdown', () => sound.unlock(), { once: true, capture: true });
sound.applyMute();
route();

// Kleine hulp voor testen in de console.
window.marcelflix = {
  reset() { store.reset(); location.hash = '#/profielen'; },
  unlock() { store.setFlag('dcUnlocked'); location.hash = '#/home'; route(); },
  debug(on = true) { try { localStorage.setItem('marcelflix.debug', on ? '1' : '0'); } catch (e) { /* */ } },
  get booted() { return booted; },
};
