import { all } from './kit';
import type { Scene } from './sequencer';

/**
 * /mobile's notification settings: what comes right away, then what waits for the digest, switched on one by one.
 * The still is the end: all on.
 */
const switches = (root: HTMLElement) => all(root, '.nt__sw');

export const mobileNotifyScene: Scene = {
  length: 9000,
  fade: true,
  reset: ({ root }) => {
    for (const sw of switches(root)) sw.classList.remove('is-on');
  },
  steps: [
    [600, ({ root }) => switches(root)[0]?.classList.add('is-on')],
    [900, ({ root }) => switches(root)[1]?.classList.add('is-on')],
    [1200, ({ root }) => switches(root)[2]?.classList.add('is-on')],
    [1500, ({ root }) => switches(root)[3]?.classList.add('is-on')],
    [1800, ({ root }) => switches(root)[4]?.classList.add('is-on')],
    [2100, ({ root }) => switches(root)[5]?.classList.add('is-on')],
    [2700, ({ root }) => switches(root)[6]?.classList.add('is-on')],
    [3000, ({ root }) => switches(root)[7]?.classList.add('is-on')],
  ],
};
