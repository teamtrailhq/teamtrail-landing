import { all, one, set, swap } from './kit';
import type { Scene, SceneCtx } from './sequencer';

/**
 * Criteria agreed before the work, met with evidence: those backed by a check are verified as it passes, one backed by
 * the agent's own test stays claimed. The last gap, an independent review, closes by itself.
 */
const ac = (n: number) => `.ac__row[data-ac="${n}"]`;
const on =
  (sel: string, cls = 'is-on', value = true) =>
  ({ root }: SceneCtx) =>
    set(root, sel, cls, value);
const verified =
  (n: number) =>
  ({ root }: SceneCtx) => {
    set(root, ac(n), 'is-running', false);
    set(root, ac(n), 'is-verified');
  };

export const criteriaScene: Scene = {
  length: 10500,
  fade: true,
  reset: ({ root }) => {
    for (const el of all(root, '.ac__done, .ac__card, .ac__row, .ac__gap, .ac__verdict'))
      el.classList.remove('is-on', 'is-running', 'is-verified', 'is-claimed', 'is-closed');
    one(root, '.ac__v-text').textContent = 'Not verified · 1 gap';
  },
  steps: [
    [300, on('.ac__card')],
    [1000, on('.ac__done')],
    [1600, on(ac(1), 'is-running')],
    [2400, verified(1)],
    [2600, on(ac(2), 'is-running')],
    [3400, verified(2)],
    [3800, on(ac(3), 'is-claimed')],
    [4500, on('.ac__gap')],
    [4700, on('.ac__verdict')],
    [6500, on('.ac__gap', 'is-closed')],
    [
      7000,
      (ctx) => {
        set(ctx.root, '.ac__verdict', 'is-verified');
        swap(ctx, one(ctx.root, '.ac__v-text'), 'Verified by Teamtrail');
      },
    ],
  ],
};
