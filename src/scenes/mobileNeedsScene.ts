import { all, flip, one, set, swap } from './kit';
import type { Scene, SceneCtx } from './sequencer';

/**
 * /mobile's hero: Needs you fills in across workspaces, a high-risk question arrives as a notification that names only
 * its kind and trail, a tap puts it at the top of the list, and it is answered there with Face ID.
 * The still is the notification over the full list, the moment it arrives.
 */
const question = (root: HTMLElement) => one(root, '.ip__row[data-q]');
const note = (root: HTMLElement) => one(root, '.ip__note');
const others = (root: HTMLElement) => all(root, '.ip__row:not([data-q]):not(.ip__later)');
const moving = (root: HTMLElement) => all(root, '.ip__row, .ip__group');

const count = (ctx: SceneCtx, n: number) => {
  one(ctx.root, '.ip__count').classList.toggle('is-empty', n === 0);
  swap(ctx, one(ctx.root, '.ip__count .sk-num'), String(n));
};

/** The rows already waiting arrive one by one, each adding to the count. */
const arrive = (i: number): Scene['steps'][number] => [
  300 + i * 300,
  (ctx) => {
    others(ctx.root)[i]?.classList.add('is-on');
    count(ctx, i + 1);
  },
];

export const mobileNeedsScene: Scene = {
  length: 10000,
  still: 2800,
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
    arrive(0),
    arrive(1),
    arrive(2),
    [1200, ({ root }) => set(root, '.ip__later', 'is-on')],
    [
      1800,
      (ctx) => {
        note(ctx.root).classList.add('is-on');
        count(ctx, 4);
      },
    ],
    [3400, ({ root }) => note(root).classList.add('is-pressed')],
    [
      3650,
      ({ root }) => {
        note(root).classList.remove('is-on', 'is-pressed');
        flip(moving(root), () => question(root).classList.add('is-on'));
      },
    ],
    [5600, ({ root }) => question(root).classList.add('is-pressed')],
    [
      5900,
      (ctx) => {
        question(ctx.root).classList.remove('is-pressed');
        question(ctx.root).classList.add('is-resolved');
        count(ctx, 3);
      },
    ],
  ],
};
