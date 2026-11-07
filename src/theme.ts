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

export function chooseLook(look: Look) {
  document.documentElement.dataset.theme = look;
  try {
    localStorage.setItem(KEY, look);
  } catch {
    // Private windows can refuse storage; the choice still holds for this page.
  }
  notify();
}

/** Marks the look on <html>, where the theme switch's icon reads it. */
export function markLook() {
  document.documentElement.dataset.look = isNight() ? 'night' : 'day';
}
