import { all, one, set, steps } from './kit';
import type { Scene } from './sequencer';

/**
 * /cloud's journey: the laptop closes, the agent's work goes on in Cloud (its step bar fills and turns green), and a
 * question that needs you reaches the phone, where it is answered in the same Lookout.
 */
const laptop = (root: HTMLElement) => one(root, '.jy__laptop');
const run = (root: HTMLElement) => one(root, '.jy__run');
const bar = (root: HTMLElement) => one(root, '.jy__run .sk-steps');
const phone = (root: HTMLElement) => one(root, '.jy__phone');
const row = (root: HTMLElement) => one(root, '.jy__row[data-row]');

export const cloudAwayScene: Scene = {
  length: 10500,
  fade: true,
  reset: ({ root }) => {
    laptop(root).classList.remove('is-closed');
    run(root).classList.remove('is-done');
    steps(bar(root), 1);
    phone(root).classList.remove('has-need');
    row(root).classList.remove('is-on', 'is-pressed', 'is-resolved');
    set(root, '.jy__link i', 'is-on', false);
  },
  steps: [
    [700, ({ root }) => laptop(root).classList.add('is-closed')],
    ...[2, 3, 4, 5].map((n, i): Scene['steps'][number] => [1900 + i * 750, ({ root }) => steps(bar(root), n)]),
    [4800, ({ root }) => run(root).classList.add('is-done')],
    ...[0, 1, 2].map((i): Scene['steps'][number] => [
      5300 + i * 220,
      ({ root }) => all(root, '.jy__link i')[i]?.classList.add('is-on'),
    ]),
    [
      6100,
      ({ root }) => {
        row(root).classList.add('is-on');
        phone(root).classList.add('has-need');
      },
    ],
    [7700, ({ root }) => row(root).classList.add('is-pressed')],
    [
      7950,
      ({ root }) => {
        row(root).classList.remove('is-pressed');
        row(root).classList.add('is-resolved');
        phone(root).classList.remove('has-need');
      },
    ],
    [8500, ({ root }) => set(root, '.jy__link i', 'is-on', false)],
  ],
};
