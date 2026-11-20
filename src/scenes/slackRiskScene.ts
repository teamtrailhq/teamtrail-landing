import { one, set } from './kit';
import type { Scene } from './sequencer';

/**
 * Still your call on /slack: a question the risk policy rates high arrives in Slack with Open in Lookout instead of
 * answer buttons. It opens in the Lookout, is answered there, and the Slack card closes with that answer.
 */
const msg = (root: HTMLElement) => one(root, '.sr__msg');
const lookout = (root: HTMLElement) => one(root, '.sr__lookout');
const need = (root: HTMLElement) => one(root, '.sr__need');

export const slackRiskScene: Scene = {
  length: 10000,
  fade: true,
  reset: ({ root }) => {
    msg(root).classList.remove('is-on', 'is-answered');
    lookout(root).classList.remove('is-on');
    need(root).classList.remove('is-resolved');
    need(root).classList.add('is-open', 'is-primary');
    set(root, '[data-open]', 'is-pressed', false);
    set(root, '.sk-choice', 'is-picked', false);
  },
  steps: [
    [400, ({ root }) => msg(root).classList.add('is-on')],
    [2500, ({ root }) => set(root, '[data-open]', 'is-pressed')],
    [2700, ({ root }) => set(root, '[data-open]', 'is-pressed', false)],
    [2900, ({ root }) => lookout(root).classList.add('is-on')],
    [4500, ({ root }) => set(root, '.sk-choice[data-pick]', 'is-picked')],
    [
      5300,
      ({ root }) => {
        need(root).classList.remove('is-open', 'is-primary');
        need(root).classList.add('is-resolved');
      },
    ],
    [6200, ({ root }) => msg(root).classList.add('is-answered')],
  ],
};
