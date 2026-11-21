import { one, set } from './kit';
import type { Scene } from './sequencer';

/**
 * /mobile's answering: a high-risk question on the phone, Keep it read-only picked, Answer with Face ID tapped, Face ID
 * confirms, and the app lands back on Needs you with the item gone and the agent going on.
 * The still is the end: back on Needs you.
 */
/** The pane is the screen: it switches between the question and Needs you. */
const screen = (root: HTMLElement) => (root.matches('.ma__screen') ? root : one(root, '.ma__screen'));
const button = (root: HTMLElement) => one(root, '.ma__btn');
const face = (root: HTMLElement) => one(root, '.ma__face');

export const mobileAnswerScene: Scene = {
  length: 10000,
  fade: true,
  reset: ({ root }) => {
    screen(root).classList.remove('is-answered');
    set(root, '.ma__opt', 'is-picked', false);
    button(root).classList.remove('is-pressed');
    face(root).classList.remove('is-on', 'is-ok');
  },
  steps: [
    [1400, ({ root }) => set(root, '.ma__opt[data-pick]', 'is-picked')],
    [2900, ({ root }) => button(root).classList.add('is-pressed')],
    [3150, ({ root }) => button(root).classList.remove('is-pressed')],
    [3250, ({ root }) => face(root).classList.add('is-on')],
    [4300, ({ root }) => face(root).classList.add('is-ok')],
    [
      5200,
      ({ root }) => {
        face(root).classList.remove('is-on', 'is-ok');
        screen(root).classList.add('is-answered');
      },
    ],
  ],
};
