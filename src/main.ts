import { type GuideRole, guideMarkup, mountScout } from '@teamtrail/scout-avatar/mount';
import { initGhStars, initSiteNav } from '@teamtrail/site/browser';
import { initCloudScene } from './cloudScene';
import { initCmdCycle } from './cmdCycle';
import { initCopy } from './copy';
import { $, $$ } from './dom';
import { initGuideDialogs } from './guideDialog';
import { initHeroField } from './heroField';
import { initScenes } from './scenes';
import { initScramble } from './scramble';
import { initReveal } from './scroll';
import { isNight, onThemeChange, theme } from './theme';
import { initThemedMedia } from './themedMedia';
import { initTrail } from './trail';
import { initVideo } from './video';
import { initWaitlist } from './waitlist';

document.documentElement.classList.add('js');
initSiteNav(theme);
initThemedMedia();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scout = $('[data-scout]');
const scoutVariant = () => (isNight() ? 'night' : 'crt');
if (scout) {
  const h = mountScout(scout, { size: 'sm', state: 'idle', framed: false, variant: scoutVariant() });
  onThemeChange(() => h.update({ variant: scoutVariant() }));
}
// Guides: one line drawing per speciality, alone on the page, coloured by its --tt-guide-* tokens (styles.css).
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

void initGhStars();
initReveal(reducedMotion);
initScramble(reducedMotion);
initCopy();
initGuideDialogs();
initCmdCycle(reducedMotion);
initVideo(reducedMotion);
initScenes(reducedMotion);
// After initScenes: each scene keeps its markup as written to put back after a turn, so Scout must not be in it yet.
// Mounted first, his inline styles would come back as style attributes, which the CSP (style-src 'self') blocks.
initCloudScene(reducedMotion);
initTrail();
initHeroField(reducedMotion);
initWaitlist();
