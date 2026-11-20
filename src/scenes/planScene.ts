import { all, one, set, swap } from './kit';
import type { Scene, SceneCtx } from './sequencer';

/**
 * A plan you approve in one step: a research agent's brief comes in, the plan's tickets wait for it, one click accepts
 * the brief and confirms every ticket's criteria, and agents start on the first tickets.
 */
const show =
  (sel: string, cls = 'is-on') =>
  ({ root }: SceneCtx) =>
    set(root, sel, cls);
const row = (n: number) => `.pl__row[data-row="${n}"]`;

export const planScene: Scene = {
  length: 10000,
  fade: true,
  reset: ({ root }) => {
    for (const el of all(root, '.pl__brief, .pl__plan, .pl__fact, .pl__row'))
      el.classList.remove('is-on', 'is-accepted', 'is-approved', 'is-pressed', 'is-confirmed', 'is-taken');
    one(root, '.pl__brief-text').textContent = 'submitted';
  },
  steps: [
    [300, show('.pl__brief')],
    [800, show('.pl__fact:nth-child(1)')],
    [1150, show('.pl__fact:nth-child(2)')],
    [1500, show('.pl__fact:nth-child(3)')],
    [2200, show('.pl__plan')],
    [2500, show(row(4))],
    [2650, show(row(5))],
    [2800, show(row(7))],
    [2950, show(row(8))],
    [4100, show('.pl__plan', 'is-pressed')],
    [
      4350,
      (ctx) => {
        set(ctx.root, '.pl__plan', 'is-pressed', false);
        set(ctx.root, '.pl__plan', 'is-approved');
        set(ctx.root, '.pl__brief', 'is-accepted');
        swap(ctx, one(ctx.root, '.pl__brief-text'), 'accepted');
      },
    ],
    [4600, show(row(4), 'is-confirmed')],
    [4750, show(row(5), 'is-confirmed')],
    [4900, show(row(7), 'is-confirmed')],
    [5050, show(row(8), 'is-confirmed')],
    [6000, show(row(4), 'is-taken')],
    [6600, show(row(5), 'is-taken')],
  ],
};
