import { all, one, swap } from './kit';
import type { Scene } from './sequencer';

/**
 * /mobile's merging: verified work on the phone, its proof lines ticking in one by one, Approve and merge tapped,
 * Merging…, the pull request merged and the trail's bar a done step longer.
 * The still is the end: merged.
 */
const button = (root: HTMLElement) => one(root, '.mm__btn');
const pr = (root: HTMLElement) => one(root, '.mm__pr');
const next = (root: HTMLElement) => one(root, '.mm__segs i[data-next]');
const lines = (root: HTMLElement) => all(root, '.mm__line');

export const mobileMergeScene: Scene = {
  length: 10000,
  fade: true,
  reset: ({ root }) => {
    for (const line of lines(root)) line.classList.remove('is-on');
    button(root).classList.remove('is-pressed', 'is-busy', 'is-done');
    pr(root).classList.remove('is-merged');
    next(root).classList.remove('is-done');
    one(root, '.mm__count').textContent = '9';
  },
  steps: [
    ...[0, 1, 2, 3, 4, 5].map((i): Scene['steps'][number] => [
      700 + i * 420,
      ({ root }) => lines(root)[i]?.classList.add('is-on'),
    ]),
    [3900, ({ root }) => button(root).classList.add('is-pressed')],
    [
      4150,
      ({ root }) => {
        button(root).classList.remove('is-pressed');
        button(root).classList.add('is-busy');
      },
    ],
    [
      5600,
      ({ root }) => {
        button(root).classList.remove('is-busy');
        button(root).classList.add('is-done');
        pr(root).classList.add('is-merged');
      },
    ],
    [
      6200,
      (ctx) => {
        next(ctx.root).classList.add('is-done');
        swap(ctx, one(ctx.root, '.mm__count'), '10');
      },
    ],
  ],
};
