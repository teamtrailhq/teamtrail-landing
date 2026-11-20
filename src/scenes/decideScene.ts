import { all, flip, one, set, swap } from './kit';
import type { Scene, SceneCtx } from './sequencer';

/**
 * The risk policy sorts agents' calls: a medium-risk one the agent decides and records for you to keep or overrule; a
 * high-risk one comes to Needs you, is answered in place and kept as your decision.
 */
const call = (id: 'a' | 'b') => `.dc__call--${id}`;
const panels = (root: HTMLElement) => all(root, '.dc__stack > .sk-panel');
const need = (root: HTMLElement) => one(root, '.dc__need');

function count(ctx: SceneCtx, n: number) {
  swap(ctx, one(ctx.root, '[data-count]'), String(n));
  set(ctx.root, '.dc__count', 'sk-chip--urgent', n > 0);
}

export const decideScene: Scene = {
  length: 10500,
  fade: true,
  reset: ({ root }) => {
    for (const el of all(root, '.dc__call')) el.classList.remove('is-on', 'is-rated', 'is-routed');
    need(root).classList.remove('is-entering', 'is-primary', 'is-pressed', 'is-open', 'is-resolved');
    set(root, '.dc__needs', 'has-need', false);
    set(root, '.dc__away-row', 'is-on', false);
    one(root, '[data-count]').textContent = '0';
    set(root, '.dc__count', 'sk-chip--urgent', false);
  },
  steps: [
    [400, ({ root }) => set(root, call('a'), 'is-on')],
    [1100, ({ root }) => set(root, call('a'), 'is-rated')],
    [
      1900,
      ({ root }) => {
        set(root, call('a'), 'is-routed');
        flip(panels(root), () => set(root, '.dc__away-row', 'is-on'));
      },
    ],
    [2700, ({ root }) => set(root, call('b'), 'is-on')],
    [3400, ({ root }) => set(root, call('b'), 'is-rated')],
    [
      4200,
      (ctx) => {
        const { root } = ctx;
        set(root, call('b'), 'is-routed');
        flip(panels(root), () => {
          set(root, '.dc__needs', 'has-need');
          need(root).classList.add('is-entering', 'is-primary');
        });
        ctx.later(() => need(root).classList.remove('is-entering'), 40);
        count(ctx, 1);
      },
    ],
    [5300, ({ root }) => need(root).classList.add('is-pressed')],
    [
      5550,
      ({ root }) => {
        need(root).classList.remove('is-pressed');
        flip(panels(root), () => need(root).classList.add('is-open'));
      },
    ],
    [6500, ({ root }) => set(root, '.dc__choices .sk-choice:last-child', 'is-picked')],
    [
      7200,
      (ctx) => {
        flip(panels(ctx.root), () => {
          need(ctx.root).classList.remove('is-primary');
          need(ctx.root).classList.add('is-resolved');
        });
        count(ctx, 0);
      },
    ],
  ],
};
