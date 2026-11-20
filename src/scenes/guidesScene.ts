import { all, one, set } from './kit';
import type { Scene, SceneCtx } from './sequencer';

/**
 * A ticket's guides: QA and Security come with its type, Accessibility is added to it; the agent that claims it answers
 * every item of each checklist, then the checks run, the guide's own among them.
 */
const LISTS = ['qa', 'security', 'a11y'] as const;
const on =
  (sel: string, cls = 'is-on') =>
  ({ root }: SceneCtx) =>
    set(root, sel, cls);
const check = (name: string) => `.gd__checks [data-check="${name}"]`;

/** Answers a guide's checklist an item at a time, from `at`; returns when it's done. */
function answer(steps: Array<[number, (ctx: SceneCtx) => void]>, id: (typeof LISTS)[number], at: number, from: number) {
  const items = (root: HTMLElement) => all(root, `[data-list="${id}"] .gd__bar i`);
  const n = id === 'qa' ? 5 : 6;
  for (let i = 0; i < n; i++) {
    steps.push([
      at + i * 110,
      ({ root }) => {
        items(root)[i].classList.add('is-on');
        one(root, `[data-list="${id}"] [data-answered]`).textContent = String(i + 1);
        one(root, '[data-total]').textContent = String(from + i + 1);
        if (i === n - 1) set(root, `[data-list="${id}"]`, 'is-complete');
      },
    ]);
  }
  return at + n * 110;
}

const steps: Array<[number, (ctx: SceneCtx) => void]> = [
  [600, on('[data-guide="qa"]')],
  [900, on('[data-guide="security"]')],
  [1700, on('[data-guide="a11y"]')],
  [2400, on('.gd__claim')],
];
const qaEnd = answer(steps, 'qa', 3000, 0);
const secEnd = answer(steps, 'security', qaEnd + 150, 5);
const a11yEnd = answer(steps, 'a11y', secEnd + 150, 11);
steps.push(
  [a11yEnd + 400, on(check('tests'), 'is-running')],
  [
    a11yEnd + 1100,
    ({ root }) => {
      set(root, check('tests'), 'is-running', false);
      set(root, check('tests'), 'is-done');
      set(root, check('a11y'), 'is-running');
    },
  ],
  [
    a11yEnd + 1900,
    ({ root }) => {
      set(root, check('a11y'), 'is-running', false);
      set(root, check('a11y'), 'is-done');
    },
  ],
);

export const guidesScene: Scene = {
  length: 10000,
  fade: true,
  reset: ({ root }) => {
    set(root, '.gd__guide, .gd__claim, .gd__bar i', 'is-on', false);
    set(root, '.gd__list', 'is-complete', false);
    for (const el of all(root, '[data-answered], [data-total]')) el.textContent = '0';
    for (const el of all(root, '.gd__checks .sk-check')) el.classList.remove('is-running', 'is-done');
  },
  steps,
};
