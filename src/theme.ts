/** The site's day or night look: night unless the visitor chose day. */
export type Look = 'day' | 'night';

const KEY = 'teamtrail-theme';
const listeners = new Set<() => void>();

export function isNight() {
  return document.documentElement.dataset.theme !== 'day';
}

export function onThemeChange(listener: () => void) {
  listeners.add(listener);
}

function notify() {
  markLook();
  for (const listener of listeners) listener();
}

/**
 * The choice as Teamtrail Cloud reads it too: `tt_theme` (light or dark) on the whole teamtrail.app domain, so
 * app.teamtrail.app opens in the same look, and its own switch writes it back. Host-only on other hosts (previews,
 * local dev).
 */
function shareLook(look: Look) {
  const site = /(^|\.)teamtrail\.app$/.test(location.hostname) ? '; Domain=teamtrail.app; Secure' : '';
  document.cookie = `tt_theme=${look === 'day' ? 'light' : 'dark'}; Path=/; Max-Age=31536000; SameSite=Lax${site}`;
}

export function chooseLook(look: Look) {
  document.documentElement.dataset.theme = look;
  try {
    localStorage.setItem(KEY, look);
  } catch {
    // Private windows can refuse storage; the choice still holds for this page.
  }
  shareLook(look);
  notify();
}

/** Marks the look on <html>, where the theme switch's icon reads it. */
export function markLook() {
  document.documentElement.dataset.look = isNight() ? 'night' : 'day';
}
