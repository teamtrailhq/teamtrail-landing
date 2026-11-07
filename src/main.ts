import { type GuideRole, guideMarkup, mountScout } from '@teamtrail/scout-avatar/mount';
import { initCloudScene } from './cloudScene';
import { initCmdCycle } from './cmdCycle';
import { initCopy } from './copy';
import { $, $$ } from './dom';
import { initSceneSwitch } from './hero/sceneSwitch';
import { mountHeroField } from './heroField';
import { initScramble } from './scramble';
import { initNav, initReveal } from './scroll';
import { isNight, onThemeChange } from './theme';
import { initThemeSwitch } from './themeSwitch';
import { initVideo } from './video';
import { initWaitlist } from './waitlist';

document.documentElement.classList.add('js');
initThemeSwitch();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

for (const canvas of $$<HTMLCanvasElement>('canvas[data-field]')) {
  mountHeroField(canvas, {
    clearCenter: canvas.dataset.field === 'hero',
    intensity: Number(canvas.dataset.intensity ?? 1),
  });
}

initSceneSwitch();

const scout = $('[data-scout]');
const scoutVariant = () => (isNight() ? 'night' : 'crt');
if (scout) {
  const h = mountScout(scout, { size: 'sm', state: 'idle', framed: false, variant: scoutVariant() });
  onThemeChange(() => h.update({ variant: scoutVariant() }));
}
// Guides: symbol badges, one per speciality.
const GUIDE_ROLES: Record<string, GuideRole> = {
  reviewer: 'reviewer',
  qa: 'qa',
  security: 'security',
  docs: 'docs',
  architect: 'architect',
  you: 'community',
};
for (const el of $$('[data-spec]')) {
  const role = GUIDE_ROLES[/spec--(\w+)/.exec(el.className)?.[1] ?? 'reviewer'];
  const size = 40 * Number(el.dataset.size ?? 1.4);
  el.innerHTML = `<svg viewBox="0 0 200 200" width="${size}" height="${size}" aria-hidden="true">${guideMarkup(role)}</svg>`;
}

initCloudScene(reducedMotion);
initNav();
initReveal(reducedMotion);
initScramble(reducedMotion);
initCopy();
initCmdCycle(reducedMotion);
initVideo(reducedMotion);
initWaitlist();
