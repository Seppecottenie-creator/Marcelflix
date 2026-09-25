// Voortgang en instellingen in localStorage. Alles zit in try/catch:
// in privévensters of met geblokkeerde opslag werkt de site gewoon verder
// (dan onthoudt ze enkel niets).

const KEY = 'marcelflix.v1';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') return { profile: null, profiles: {}, settings: {}, ...data };
    }
  } catch (e) { /* geen opslag beschikbaar */ }
  return { profile: null, profiles: {}, settings: {} };
}

let state = read();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* negeren */ }
}

function profileData() {
  const id = state.profile || '_';
  if (!state.profiles[id]) state.profiles[id] = { episodes: {}, flags: {} };
  const p = state.profiles[id];
  p.episodes ||= {};
  p.flags ||= {};
  return p;
}

export const epKey = (seriesId, epId) => `${seriesId}/${epId}`;

export const store = {
  get profile() { return state.profile; },
  setProfile(id) { state.profile = id; save(); },

  setting(name, fallback) {
    return name in state.settings ? state.settings[name] : fallback;
  },
  setSetting(name, value) { state.settings[name] = value; save(); },

  /** Voortgang van één aflevering voor het actieve profiel. */
  episode(key) {
    const e = profileData().episodes[key];
    return {
      lastScene: null, history: [], endings: [], finished: false, plays: 0, updated: 0,
      ...(e || {}),
    };
  },
  updateEpisode(key, fn) {
    const p = profileData();
    const cur = this.episode(key);
    const next = fn(cur) || cur;
    next.updated = Date.now();
    p.episodes[key] = next;
    save();
    return next;
  },
  allEpisodes() { return profileData().episodes; },

  flag(name) { return !!profileData().flags[name]; },
  setFlag(name, value = true) { profileData().flags[name] = value; save(); },

  reset() {
    state = { profile: null, profiles: {}, settings: {} };
    save();
  },
};
