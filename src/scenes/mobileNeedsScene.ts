import { all, flip, one, set, swap } from './kit';
import type { Scene, SceneCtx } from './sequencer';

/**
 * /mobile's hero: Needs you fills in across workspaces, a high-risk question arrives as a notification that names only
 * its kind and trail, a tap puts it at the top of the list, and it is answered there with Face ID.
 * The still is the list with the question on top, before it is answered.
 */
const question = (root: HTMLElement) => one(root, '.ip__row[data-q]');
const note = (root: HTMLElement) => one(root, '.ip__note');
const others = (root: HTMLElement) => all(root, '.ip__row:not([data-q])');
const moving = (root: HTMLElement) => all(root, '.ip__row, .ip__group');

const count = (ctx: SceneCtx, n: number) => {
  one(ctx.root, '.ip__count').classList.toggle('is-empty', n === 0);
  swap(ctx, one(ctx.root, '.ip__count .sk-num'), String(n));
};

export const mobileNeedsScene: Scene = {
  length: 10000,
  still: 4500,
  fade: true,
  reset: ({ root }) => {
    question(root).classList.remove('is-on', 'is-pressed', 'is-resolved');
    for (const row of others(root)) row.classList.remove('is-on');
    set(root, '.ip__later', 'is-on', false);
    note(root).classList.remove('is-on', 'is-pressed');
    one(root, '.ip__count .sk-num').textContent = '0';
    one(root, '.ip__count').classList.add('is-empty');
  },
  steps: [
    [
      300,
      (ctx) => {
        others(ctx.root)[0]?.classList.add('is-on');
        count(ctx, 1);
      },
    ],
    [
      650,
      (ctx) => {
        others(ctx.root)[1]?.classList.add('is-on');
        count(ctx, 2);
      },
    ],
    [1000, ({ root }) => set(root, '.ip__later', 'is-on')],
    [1800, ({ root }) => note(root).classList.add('is-on')],
    [3100, ({ root }) => note(root).classList.add('is-pressed')],
    [
      3350,
      (ctx) => {
        note(ctx.root).classList.remove('is-on', 'is-pressed');
        flip(moving(ctx.root), () => question(ctx.root).classList.add('is-on'));
        count(ctx, 3);
      },
    ],
    [5600, ({ root }) => question(root).classList.add('is-pressed')],
    [
      5900,
      (ctx) => {
        question(ctx.root).classList.remove('is-pressed');
        question(ctx.root).classList.add('is-resolved');
        count(ctx, 2);
      },
    ],
  ],
};
