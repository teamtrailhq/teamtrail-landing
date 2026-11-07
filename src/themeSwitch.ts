import { $$ } from './dom';
import { chooseLook, followSystem, isNight, onThemeChange } from './theme';
import { initThemedMedia } from './themedMedia';

function label() {
  const text = isNight() ? 'Switch to day theme' : 'Switch to night theme';
  for (const button of $$('[data-theme-switch]')) button.setAttribute('aria-label', text);
}

/** The nav's sun and moon button, and everything that follows the theme. */
export function initThemeSwitch() {
  followSystem();
  initThemedMedia();
  label();
  onThemeChange(label);
  for (const button of $$('[data-theme-switch]')) {
    button.addEventListener('click', () => chooseLook(isNight() ? 'day' : 'night'));
  }
}
