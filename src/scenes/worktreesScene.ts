import { all, set } from './kit';
import type { Scene, SceneCtx } from './sequencer';

/**
 * A worktree per ticket: each claim gets its own branch and folder, the approved setup step runs in it, and the agent
 * starts. Verified work stays on its branch; nothing is merged for you.
 */
type Id = 'a' | 'b' | 'c';
const card = (id: Id) => `.wt__card--${id}`;
const on =
  (sel: string, cls = 'is-on') =>
  ({ root }: SceneCtx) =>
    set(root, sel, cls);

/** One claim: the branch draws out of main, the card arrives, setup runs, then the agent works. */
const claim = (id: Id, at: number): Array<[number, (ctx: SceneCtx) => void]> => [
  [at, on(`.wt__branch--${id}`)],
  [at + 300, on(card(id))],
  [at + 650, on(card(id), 'is-setup')],
  [at + 1450, on(card(id), 'is-ready')],
];

export const worktreesScene: Scene = {
  length: 9600,
  fade: true,
  reset: ({ root }) => {
    for (const el of all(root, '.wt__branch, .wt__card'))
      el.classList.remove('is-on', 'is-setup', 'is-ready', 'is-verified');
  },
  steps: [...claim('a', 300), ...claim('b', 1700), ...claim('c', 3100), [6000, on(card('a'), 'is-verified')]],
};
