// Laadt site.json, series/<id>/series.json en series/<id>/<ep>/episode.json.
import { store, epKey } from './store.js';

const cache = new Map();

function getJSON(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`${url} kon niet geladen worden (${r.status})`);
      return r.json().catch((e) => { throw new Error(`${url} bevat geen geldige JSON: ${e.message}`); });
    }));
    cache.get(url).catch(() => cache.delete(url));
  }
  return cache.get(url);
}

let sitePromise;

/** Site + alle series (series die niet laden worden overgeslagen met een waarschuwing). */
export function loadSite() {
  sitePromise ||= (async () => {
    const site = await getJSON('site.json');
    const list = await Promise.all(site.series.map(async (id) => {
      try {
        const s = await getJSON(`series/${id}/series.json`);
        return normalizeSeries(id, s);
      } catch (e) {
        console.warn(e);
        return null;
      }
    }));
    const series = new Map(list.filter(Boolean).map((s) => [s.id, s]));
    return { ...site, seriesMap: series, seriesList: [...series.values()] };
  })();
  sitePromise.catch(() => { sitePromise = null; });
  return sitePromise;
}

function normalizeSeries(id, s) {
  const base = `series/${id}/`;
  const episodes = (s.episodes || []).map((ep, i) => ({
    ...ep,
    number: i + 1,
    available: !ep.soon,
    key: epKey(id, ep.id),
    base: `${base}${ep.id}/`,
  }));
  return {
    theme: id,
    ...s,
    id,
    base,
    episodes,
    playable: episodes.some((e) => e.available),
  };
}

export async function loadEpisode(series, epId) {
  const meta = series.episodes.find((e) => e.id === epId);
  if (!meta) throw new Error(`Aflevering "${epId}" staat niet in series/${series.id}/series.json`);
  const ep = await getJSON(`${meta.base}episode.json`);
  const endings = Object.entries(ep.scenes || {})
    .filter(([, sc]) => sc.ending)
    .map(([id, sc]) => ({ id, title: sc.ending }));
  return { ...ep, meta, base: meta.base, key: meta.key, endings };
}

/** Kijkt of een bestand bestaat (gecachet), zonder het volledig te downloaden. */
const existsCache = new Map();
export function fileExists(url) {
  if (!existsCache.has(url)) {
    existsCache.set(url, fetch(url, { method: 'HEAD', cache: 'no-cache' })
      .then((r) => r.ok)
      .catch(() => false));
  }
  return existsCache.get(url);
}

export function resolveUrl(series, file) {
  if (!file) return null;
  if (/^(https?:)?\/\//.test(file) || file.startsWith('/') || file.startsWith('assets/')) return file;
  return series.base + file;
}

// ---------- Director's Cut ----------

/** Alle afleveringen die meetellen voor de Director's Cut (speelbaar, niet verborgen). */
export function requiredEpisodes(site) {
  return site.seriesList
    .filter((s) => !s.hidden)
    .flatMap((s) => s.episodes.filter((e) => e.available));
}

export function directorsCutUnlocked(site) {
  const req = requiredEpisodes(site);
  if (!req.length) return false;
  if (store.flag('dcUnlocked')) return true;
  return req.every((e) => store.episode(e.key).finished);
}

export function directorsCutSeries(site) {
  return site.seriesMap.get(site.directorsCut) || null;
}

/** Series die op home zichtbaar zijn (verborgen enkel als ontgrendeld). */
export function visibleSeries(site) {
  const dc = directorsCutUnlocked(site);
  return site.seriesList.filter((s) => !s.hidden || (dc && s.id === site.directorsCut));
}
