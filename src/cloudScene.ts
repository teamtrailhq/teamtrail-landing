import { mountScout } from '@teamtrail/scout-avatar/mount';
import { $ } from './dom';

/**
 * /cloud page art, drawn as line icons on the page's ink: a laptop and a phone, with Scout in a square frame between
 * them (cloud/index.html). Colours follow the theme: lines in currentColor, the phone's lines in the blaze fill.
 */
const LAPTOP = `<svg viewBox="0 0 96 72" width="96" height="72" aria-hidden="true"><rect x="14" y="6" width="68" height="46" fill="none" stroke="currentColor" stroke-width="3"/><path d="M4 60H92" stroke="currentColor" stroke-width="3"/><path d="M38 60V56H58V60" fill="none" stroke="currentColor" stroke-width="3"/><path d="M30 29H66" stroke="var(--faint)" stroke-width="2" stroke-dasharray="3 4"/></svg>`;
const PHONE = `<svg viewBox="0 0 96 72" width="96" height="72" aria-hidden="true"><rect x="32" y="2" width="32" height="66" fill="none" stroke="currentColor" stroke-width="3"/><path d="M40 16H56M40 26H56M40 36H50" stroke="var(--fill)" stroke-width="3"/></svg>`;

const LINES = ['Agents are on it', "I'll ping your phone", 'Close the laptop', 'Only the calls that matter'];

/** Scout drawn square, to fill his square frame (an option older scout-avatar versions ignore). */
const SQUARE = { framed: false, shape: 'square' } as const;

/** Scout with a short line every few seconds, like the nav mark. */
function talkingScout(host: HTMLElement, size: number, reducedMotion: boolean) {
  const opts = { ...SQUARE, size, state: 'idle' as const };
  const h = mountScout(host, opts);
  if (reducedMotion) return;
  let i = 0;
  const talk = () =>
    h.update({
      speaking: LINES[i++ % LINES.length],
      onSpeakEnd: () => {
        h.update({ speaking: undefined });
        setTimeout(talk, 5200);
      },
    });
  setTimeout(talk, 1800);
}

export function initCloudScene(reducedMotion: boolean) {
  // Hero: Scout in his frame, saying a short line every few seconds.
  const scout = $('[data-cloud-scout]');
  if (scout) talkingScout(scout, Number(scout.dataset.size ?? 3), reducedMotion);
  // Journey strip: sleeping laptop → Scout, thinking → phone.
  const laptop = $('[data-px-laptop]');
  if (laptop) laptop.innerHTML = LAPTOP;
  const phone = $('[data-px-phone]');
  if (phone) phone.innerHTML = PHONE;
  const midScout = $('[data-cloud-mid-scout]');
  const midState = reducedMotion ? 'idle' : 'thinking';
  const midOpts = { ...SQUARE, size: 1.6, state: midState as 'idle' | 'thinking' };
  if (midScout) mountScout(midScout, midOpts);
}
