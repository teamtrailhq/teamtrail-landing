import { all, flip, one, set, swap } from './kit';
import type { Scene } from './sequencer';

/**
 * Hands-off: a question arrives at the top of Needs you, is answered in place and resolves, then leaves and the next
 * item rises. The loop ends where it starts (two items, the question gone), so it needs no fade.
 */
const rows = (root: HTMLElement) => all(root, '.sk-need, .ny__away');
const row = (root: HTMLElement) => one(root, '[data-row="a"]');

export const needsScene: Scene = {
  length: 9000,
  reset: ({ root }) => {
    row(root).classList.remove('is-open', 'is-resolved', 'is-primary', 'is-entering', 'is-leaving', 'is-pressed');
    row(root).classList.add('is-gone');
    set(root, '.sk-choice', 'is-picked', false);
    set(root, '[data-row="b"]', 'is-primary');
    one(root, '[data-count]').textContent = '2';
  },
  steps: [
    [
      500,
      (ctx) => {
        const a = row(ctx.root);
        flip(rows(ctx.root), () => {
          a.classList.remove('is-gone');
          a.classList.add('is-entering', 'is-primary');
          set(ctx.root, '[data-row="b"]', 'is-primary', false);
        });
        ctx.later(() => a.classList.remove('is-entering'), 40);
        swap(ctx, one(ctx.root, '[data-count]'), '3');
      },
    ],
    [2100, ({ root }) => row(root).classList.add('is-pressed')],
    [
      2350,
      ({ root }) => {
        row(root).classList.remove('is-pressed');
        flip(rows(root), () => row(root).classList.add('is-open'));
      },
    ],
    [3700, ({ root }) => set(root, '.sk-choice:last-child', 'is-picked')],
    [
      4500,
      (ctx) => {
        flip(rows(ctx.root), () => row(ctx.root).classList.add('is-resolved'));
        swap(ctx, one(ctx.root, '[data-count]'), '2');
      },
    ],
    [6100, ({ root }) => row(root).classList.add('is-leaving')],
    [
      6450,
      ({ root }) => {
        flip(rows(root), () => {
          row(root).classList.add('is-gone');
          row(root).classList.remove('is-open', 'is-resolved', 'is-leaving');
        });
      },
    ],
    [6800, ({ root }) => set(root, '[data-row="b"]', 'is-primary')],
  ],
};
