import { one, set, type } from './kit';
import type { Scene, SceneCtx } from './sequencer';

/**
 * You don't get asked twice: an agent goes to ask what the logbook already holds, gets the decision back instead of a
 * question, and cites it. Below, the scorecard from the same records.
 */
const QUESTION = 'Sync deletes to every device?';
const on =
  (sel: string, cls = 'is-on') =>
  ({ root }: SceneCtx) =>
    set(root, sel, cls);

export const recordScene: Scene = {
  length: 10000,
  fade: true,
  reset: ({ root }) => {
    set(root, '.rc__score, .rc__agent, .rc__found, .rc__go', 'is-on', false);
    set(root, '.rc__log', 'is-match', false);
    set(root, '.rc__log', 'is-cited', false);
    one(root, '.rc__typed').textContent = '';
  },
  steps: [
    [300, on('.rc__score')],
    [900, on('.rc__agent')],
    [1300, (ctx) => type(ctx, one(ctx.root, '.rc__typed'), QUESTION, 38)],
    [3000, on('.rc__found')],
    [3050, on('.rc__log', 'is-match')],
    [3900, on('.rc__go')],
    [4700, on('.rc__log', 'is-cited')],
  ],
};
