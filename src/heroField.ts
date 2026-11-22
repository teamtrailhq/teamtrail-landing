import { mountTrailField } from '@teamtrail/site/browser';
import { theme } from './theme';

/** The hero's copy, which the trail field keeps clear of along with the column it stands in. */
const COPY = ['.hero__badge', '.hero h1', '.hero__lede', '.hero__actions'];

/**
 * The home hero's trail field (teamtrail's packages/site): faint trails growing in the margins around the copy and
 * the video, behind the main trail (partials/trail.html), ending under the video's frame.
 */
export function initHeroField(reducedMotion: boolean) {
  const main = document.querySelector<HTMLElement>('main');
  if (!main || !document.querySelector('.hero--home') || !document.querySelector('.shot--hero')) return;
  const watch = ['.hero--home', '.hero-video'].map((s) => document.querySelector(s)).filter((e) => e !== null);
  mountTrailField({
    host: main,
    clear: () => COPY.flatMap((s) => [...document.querySelectorAll(s)]),
    frame: () => document.querySelector('.shot--hero'),
    watch,
    reducedMotion,
    theme,
  });
}
