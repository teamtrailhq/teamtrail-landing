import { all, one, set } from './kit';
import type { Scene } from './sequencer';

/**
 * /cloud's hero: the team signs in with GitHub (owner, member, viewer), Scout keeps the Lookout up between them and
 * the work, and when claude-02 pushes 4f2a91c Cloud runs the approved checks on that commit: verified, then merged.
 */
const checks = (root: HTMLElement) => all(root, '[data-check]');
const card = (root: HTMLElement) => one(root, '.ch__checks');

/** The relay's three squares, lit one after another from `at`. */
const relay = (sel: string, at: number): Scene['steps'] =>
  [0, 1, 2].map((i) => [at + i * 200, ({ root }) => all(root, `${sel} i`)[i]?.classList.add('is-on')]);

function check(root: HTMLElement, i: number, state: 'running' | 'done') {
  const el = checks(root)[i];
  el.classList.toggle('is-running', state === 'running');
  el.classList.toggle('is-done', state === 'done');
}

export const cloudHeroScene: Scene = {
  length: 10000,
  fade: true,
  reset: ({ root }) => {
    set(root, '[data-person]', 'is-on', false);
    set(root, '.sk-relay i', 'is-on', false);
    set(root, '[data-check]', 'is-done', false);
    set(root, '[data-check]', 'is-running', false);
    card(root).classList.remove('is-verified', 'is-merged');
  },
  steps: [
    ...[0, 1, 2].map((i): Scene['steps'][number] => [
      400 + i * 550,
      ({ root }) => all(root, '[data-person]')[i]?.classList.add('is-on'),
    ]),
    ...relay('.ch__relay--a', 2000),
    ...relay('.ch__relay--b', 2900),
    [3500, ({ root }) => check(root, 0, 'running')],
    [4300, ({ root }) => check(root, 0, 'done')],
    [4400, ({ root }) => check(root, 1, 'running')],
    [5700, ({ root }) => check(root, 1, 'done')],
    [6100, ({ root }) => card(root).classList.add('is-verified')],
    [7100, ({ root }) => card(root).classList.add('is-merged')],
  ],
};
