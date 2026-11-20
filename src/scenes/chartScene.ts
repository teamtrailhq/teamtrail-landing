import { all, one, set, swap, type } from './kit';
import type { Scene, SceneCtx } from './sequencer';

/** Chart the trail: the destination is typed, then the map's tickets appear one by one, joined by the trail. */
const DESTINATION = 'Notes sync offline. No edit is ever lost.';

const show =
  (sel: string) =>
  ({ root }: SceneCtx) =>
    set(root, sel, 'is-on');

export const chartScene: Scene = {
  length: 9600,
  fade: true,
  reset: ({ root }) => {
    one(root, '.chart__typed').textContent = '';
    for (const el of all(root, '.chart__t, .chart__wire, .chart__status')) el.classList.toggle('is-on', false);
    set(root, '.chart__t4', 'is-urgent', false);
    set(root, '.chart__prompt', 'is-typing');
    set(root, '.chart__prompt', 'is-sent', false);
    one(root, '.chart__status-text').textContent = 'claude-02 · reading the code';
  },
  steps: [
    [300, (ctx) => type(ctx, one(ctx.root, '.chart__typed'), DESTINATION, 26)],
    [
      2300,
      ({ root }) => {
        set(root, '.chart__prompt', 'is-typing', false);
        set(root, '.chart__prompt', 'is-sent');
      },
    ],
    [2600, show('.chart__status')],
    [2900, show('.chart__t1')],
    [3350, show('.w1')],
    [3550, show('.w2')],
    [3750, show('.w3, .w4')],
    [3950, show('.chart__t2')],
    [4150, show('.chart__t3')],
    [4650, show('.w5, .w6')],
    [4850, show('.w7')],
    [5050, show('.w8')],
    [5250, show('.chart__t4')],
    [5700, (ctx) => swap(ctx, one(ctx.root, '.chart__status-text'), 'claude-02 · worked for 12 sec · 4 tickets')],
    [6100, ({ root }) => set(root, '.chart__t4', 'is-urgent')],
  ],
};
