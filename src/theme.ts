/** The site's day or night look: the visitor's choice if they made one, otherwise their system. */
export type Look = 'day' | 'night';

const KEY = 'teamtrail-theme';
const system = matchMedia('(prefers-color-scheme: dark)');
const listeners = new Set<() => void>();

function chosen(): Look | undefined {
  const value = document.documentElement.dataset.theme;
  return value === 'day' || value === 'night' ? value : undefined;
}

export function isNight() {
  return (chosen() ?? (system.matches ? 'night' : 'day')) === 'night';
}

export function onThemeChange(listener: () => void) {
  listeners.add(listener);
}

function notify() {
  document.documentElement.dataset.look = isNight() ? 'night' : 'day';
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

/** Keeps followers in step when the system changes and the visitor hasn't chosen. */
export function followSystem() {
  document.documentElement.dataset.look = isNight() ? 'night' : 'day';
  system.addEventListener('change', () => {
    if (!chosen()) notify();
  });
}
