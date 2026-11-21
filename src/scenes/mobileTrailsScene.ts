import { one, swap } from './kit';
import type { Scene } from './sequencer';

/**
 * /mobile's Trails screen: on Billing v2 an agent's ticket is verified, its segment turns green and the count moves on.
 * The still is the end: 10 of 14 done.
 */
const next = (root: HTMLElement) => one(root, '.tr__segs i[data-next]');

export const mobileTrailsScene: Scene = {
  length: 9000,
  fade: true,
  reset: ({ root }) => {
    next(root).classList.remove('is-done');
    next(root).classList.add('is-work');
    one(root, '.tr__done').textContent = '9';
    one(root, '.tr__agents').textContent = '2 agents';
  },
  steps: [
    [
      3000,
      (ctx) => {
        next(ctx.root).classList.remove('is-work');
        next(ctx.root).classList.add('is-done');
        swap(ctx, one(ctx.root, '.tr__done'), '10');
        swap(ctx, one(ctx.root, '.tr__agents'), '1 agent');
      },
    ],
  ],
};
