import { all, countUp, one, set, swap } from './kit';
import type { Scene, SceneCtx } from './sequencer';

/** Done means proven: a completion comes in, Teamtrail runs each check itself, and the proof is verified and signed. */
const check = (root: HTMLElement, name: string) => one(root, `[data-check="${name}"]`);
const run =
  (name: string) =>
  ({ root }: SceneCtx) =>
    check(root, name).classList.add('is-running');
const pass =
  (name: string) =>
  ({ root }: SceneCtx) => {
    check(root, name).classList.toggle('is-running', false);
    check(root, name).classList.add('is-done');
  };

export const proofScene: Scene = {
  length: 10500,
  fade: true,
  reset: ({ root }) => {
    for (const el of all(root, '.sk-check')) {
      el.classList.toggle('is-running', false);
      el.classList.toggle('is-done', false);
    }
    set(root, '.proof__done, .proof__card', 'is-on', false);
    set(root, '.proof__card', 'is-verified', false);
    one(root, '.proof__count').textContent = '0';
    one(root, '.proof__state-text').textContent = 'verifying';
    set(root, '.proof__digest', 'is-on', false);
  },
  steps: [
    [300, ({ root }) => set(root, '.proof__done', 'is-on')],
    [1000, ({ root }) => set(root, '.proof__card', 'is-on')],
    [1600, run('lint')],
    [2200, (ctx) => [pass('lint'), run('types')].forEach((f) => f(ctx))],
    [2900, (ctx) => [pass('types'), run('tests')].forEach((f) => f(ctx))],
    [2950, (ctx) => countUp(ctx, one(ctx.root, '.proof__count'), 412, 1000)],
    [4100, (ctx) => [pass('tests'), run('review')].forEach((f) => f(ctx))],
    [5000, (ctx) => [pass('review'), run('guard')].forEach((f) => f(ctx))],
    [5600, pass('guard')],
    [
      6100,
      (ctx) => {
        set(ctx.root, '.proof__card', 'is-verified');
        swap(ctx, one(ctx.root, '.proof__state-text'), 'verified');
      },
    ],
    [6700, ({ root }) => set(root, '.proof__digest', 'is-on')],
  ],
};
