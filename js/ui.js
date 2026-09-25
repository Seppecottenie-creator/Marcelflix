// Kleine UI-hulpjes: HTML-escaping, iconen, Marcel-avatar, affiches, toasts.

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function html(strings, ...values) {
  return strings.reduce((out, s, i) => out + s + (i < values.length ? values[i] : ''), '');
}

export function fromHTML(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export const icon = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.2-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.2v.1" stroke-linecap="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  skip: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 5.5v13a.8.8 0 0 0 1.25.66L15 13v5.5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-13a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1V11L6.25 4.84A.8.8 0 0 0 5 5.5z"/></svg>',
  subs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 13h4M13 13h4M7 16h7" stroke-linecap="round"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>',
  branch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v10M18 10c0 4-6 3-11.2 7.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  thumb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M7 10v10H4V10zM7 10l4-7c1.7 0 2.6 1 2.3 2.7L12.8 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
  paw: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><ellipse cx="6" cy="10" rx="2.1" ry="2.7"/><ellipse cx="10" cy="6.3" rx="2.1" ry="2.8"/><ellipse cx="14.5" cy="6.3" rx="2.1" ry="2.8"/><ellipse cx="18.4" cy="10" rx="2.1" ry="2.7"/><path d="M12.2 11c2.8 0 5.6 3.6 5.6 6.2 0 2-1.6 2.8-3 2.8-1.1 0-1.7-.6-2.6-.6s-1.5.6-2.6.6c-1.4 0-3-.8-3-2.8C6.6 14.6 9.4 11 12.2 11z"/></svg>',
};

/** Marcel als SVG: ronde kop, blauwgrijs, diep oranje ogen. */
export function marcelSVG({ bg = null, accessory = null, idSuffix = Math.random().toString(36).slice(2, 7) } = {}) {
  const g = `mg${idSuffix}`;
  const acc = {
    strik: '<g transform="translate(70 22) rotate(18)"><path d="M0 0l-15-9v18zM0 0l15-9v18z" fill="#ff4f7a" stroke="#b3123e" stroke-width="1.5" stroke-linejoin="round"/><circle r="4.5" fill="#ff7a99" stroke="#b3123e" stroke-width="1.5"/></g>',
    bril: '<g fill="none" stroke="#111" stroke-width="3"><circle cx="37" cy="58" r="10"/><circle cx="63" cy="58" r="10"/><path d="M47 57h6"/></g>',
    kroon: '<path d="M30 21l6 12 7-14 7 14 7-14 7 14 6-12-4 20H34z" fill="#ffd23f" stroke="#b38600" stroke-width="1.5" stroke-linejoin="round"/>',
    pet: '<path d="M26 32c4-14 44-14 48 0l6 4H20z" fill="#1c2c55"/><rect x="45" y="22" width="10" height="8" rx="2" fill="#ffcc33"/>',
  }[accessory] || '';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    ${bg ? `<rect width="100" height="100" fill="${bg}"/>` : ''}
    <defs><radialGradient id="${g}" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#a3adbb"/><stop offset=".7" stop-color="#7d8898"/><stop offset="1" stop-color="#606b7a"/></radialGradient></defs>
    <path d="M14 46 L19 14 L42 32 Z M86 46 L81 14 L58 32 Z" fill="#6f7a8a"/>
    <path d="M20 40 L22 22 L36 33 Z M80 40 L78 22 L64 33 Z" fill="#c69aa0" opacity=".7"/>
    <ellipse cx="50" cy="60" rx="40" ry="33" fill="url(#${g})"/>
    <ellipse cx="50" cy="78" rx="17" ry="11" fill="#8f9aa9" opacity=".6"/>
    <ellipse cx="36" cy="57" rx="8" ry="8.5" fill="#e8741a"/><ellipse cx="64" cy="57" rx="8" ry="8.5" fill="#e8741a"/>
    <ellipse cx="36" cy="57" rx="8" ry="8.5" fill="none" stroke="#3c2a1a" stroke-width="1.2"/><ellipse cx="64" cy="57" rx="8" ry="8.5" fill="none" stroke="#3c2a1a" stroke-width="1.2"/>
    <ellipse cx="36" cy="57" rx="2.6" ry="6.5" fill="#111"/><ellipse cx="64" cy="57" rx="2.6" ry="6.5" fill="#111"/>
    <circle cx="38.5" cy="53.5" r="1.8" fill="#fff" opacity=".85"/><circle cx="66.5" cy="53.5" r="1.8" fill="#fff" opacity=".85"/>
    <path d="M46 69h8l-4 4.5z" fill="#6b5a66"/>
    <path d="M50 73.5c-1 3-4 4-6.5 3M50 73.5c1 3 4 4 6.5 3" fill="none" stroke="#3f4652" stroke-width="1.4" stroke-linecap="round"/>
    <g stroke="#e9edf2" stroke-width=".9" opacity=".6" stroke-linecap="round"><path d="M30 72l-18-2M30 75l-17 3M70 72l18-2M70 75l17 3"/></g>
    ${acc}
  </svg>`;
}

export function avatarHTML(profile) {
  return marcelSVG({ bg: profile.color, accessory: profile.accessory, idSuffix: profile.id });
}

/** "The Rookie: K-Kat" → kleine bovenregel + grote titel. */
export function titleHTML(title) {
  const t = String(title || '');
  const i = t.indexOf(':');
  if (i > 0 && i < t.length - 1) return `<small>${esc(t.slice(0, i + 1))}</small>${esc(t.slice(i + 1).trim())}`;
  const en = t.match(/^(.+?)\s(en de .+)$/);
  if (en) return `${esc(en[1])}<small style="margin-top:.2em">${esc(en[2])}</small>`;
  return esc(t);
}

/**
 * Affiche/artwork van een serie. Probeert eerst een echte afbeelding;
 * als die ontbreekt, blijft de CSS-versie in de stijl van de serie staan.
 */
export function artHTML(series, { image = undefined, tall = false, title = true, mark = true } = {}) {
  const img = image === undefined ? (series.poster ? series.base + series.poster : null) : image;
  return `<div class="art theme-${esc(series.theme)}${tall ? ' tall' : ''}">
    <div class="art-deco"></div>
    <div class="art-cat">${marcelSVG({ accessory: series.theme === 'rookie' ? 'pet' : series.theme === 'potter' ? 'kroon' : null, idSuffix: series.id + (tall ? 't' : '') })}</div>
    ${img ? `<img class="art-img" alt="" loading="lazy" src="${esc(img)}" onload="this.parentNode.classList.add('has-img')" onerror="this.remove()">` : ''}
    ${mark ? '<div class="art-mark">M</div>' : ''}
    ${title ? `<div class="art-title t-title">${titleHTML(series.title)}</div>` : ''}
  </div>`;
}

export function starsHTML(score) {
  const m = String(score || '').replace(',', '.').match(/([\d.]+)\s*\/\s*(\d+)/);
  if (!m) return '';
  const val = Math.round((parseFloat(m[1]) / parseFloat(m[2])) * 5);
  let s = '';
  for (let i = 1; i <= 5; i++) s += i <= val ? '★' : '☆';
  return `<span class="stars" aria-label="${esc(score)}">${s}</span>`;
}

export function toast(message, ms = 3200) {
  const box = document.getElementById('toasts');
  if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = message;
  box.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 350);
  }, ms);
}

export function isTouch() {
  return window.matchMedia('(pointer: coarse)').matches;
}

/** Op gsm/tablet schermvullend gaan (moet vanuit een tik gebeuren). */
export function enterFullscreenOnMobile() {
  if (!isTouch()) return;
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req && !document.fullscreenElement) {
    try { const p = req.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch (e) { /* niet ondersteund */ }
  }
}

export function toggleFullscreen() {
  const d = document;
  if (d.fullscreenElement || d.webkitFullscreenElement) {
    (d.exitFullscreen || d.webkitExitFullscreen)?.call(d);
  } else {
    const el = d.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) { try { const p = req.call(el); if (p && p.catch) p.catch(() => {}); } catch (e) { /* */ } }
  }
}
