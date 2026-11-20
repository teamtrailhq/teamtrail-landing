import { all, flip, one, swap } from './kit';
import type { Scene } from './sequencer';

/**
 * Beside What you need on /slack: Alex mentions @Scout and gets a private, read-only answer from the Teamtrail on
 * their machine (#12 is blocked by #9). Teamtrail stops; the next mention gets "Your Teamtrail isn't running".
 * New messages push the older ones up, as in a channel.
 * The still is the first mention answered, Teamtrail running.
 */
const msgs = (root: HTMLElement) => all(root, '[data-msg]');
const msg = (root: HTMLElement, n: number) => one(root, `[data-msg="${n}"]`);

function arrive(root: HTMLElement, n: number, later: (fn: () => void, ms: number) => void) {
  const m = msg(root, n);
  flip(msgs(root), () => {
    m.classList.remove('is-gone');
    m.classList.add('is-entering');
  });
  later(() => m.classList.remove('is-entering'), 40);
}

function running(root: HTMLElement, on: boolean) {
  one(root, '.sm__run').classList.toggle('is-live', on);
}

export const slackMentionScene: Scene = {
  length: 10500,
  still: 3000,
  fade: true,
  reset: ({ root }) => {
    for (const m of msgs(root)) m.classList.add('is-gone');
    running(root, true);
    one(root, '.sm__run-text').textContent = 'running';
  },
  steps: [
    [500, (ctx) => arrive(ctx.root, 1, ctx.later)],
    [1700, (ctx) => arrive(ctx.root, 2, ctx.later)],
    [
      4600,
      (ctx) => {
        running(ctx.root, false);
        swap(ctx, one(ctx.root, '.sm__run-text'), 'stopped');
      },
    ],
    [5700, (ctx) => arrive(ctx.root, 3, ctx.later)],
    [6900, (ctx) => arrive(ctx.root, 4, ctx.later)],
  ],
};
