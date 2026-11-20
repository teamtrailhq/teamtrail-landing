import { mountScout } from '@teamtrail/scout-avatar/mount';
import { $ } from './dom';
import { keepMounted } from './keepMounted';

/**
 * /cloud's Scout: in his square frame in the hero scene, saying a short line every few seconds, and on the journey
 * between the laptop and the phone (partials/scene-cloud-hero.html, cloud/index.html). The scenes around him are
 * src/scenes/cloudHeroScene.ts and cloudAwayScene.ts.
 */
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
  // Journey: Scout thinking, between the closed laptop and the phone. The journey is a scene whose root goes back to
  // its markup after each turn (src/scenes/sequencer.ts), which replaces Scout's host: mount him again on the new one.
  const midState = reducedMotion ? 'idle' : 'thinking';
  const midOpts = { ...SQUARE, size: 1.6, state: midState as 'idle' | 'thinking' };
  keepMounted('[data-cloud-mid-scout]', (host) => mountScout(host, midOpts));
}
