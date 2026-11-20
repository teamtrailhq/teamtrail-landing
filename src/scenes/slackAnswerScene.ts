import { all, flip, one, set, swap } from './kit';
import type { Scene } from './sequencer';

/**
 * /slack's hero: Scout posts an agent's question in a Slack thread, and the same question tops Needs you in the
 * Lookout (2 → 3). A button is pressed, the answer passes back to Teamtrail on your machine, the card closes with it
 * ("✓ Answered by @Alex Rivera via Slack … claude-02 resumed.") and the row resolves and leaves (3 → 2).
 */
const msg = (root: HTMLElement) => one(root, '.sa__msg');
const row = (root: HTMLElement) => one(root, '[data-row="a"]');
const rows = (root: HTMLElement) => all(root, '.sa__rows .sk-need');
const relay = (root: HTMLElement) => all(root, '.sa__relay i');

export const slackAnswerScene: Scene = {
  length: 10000,
  fade: true,
  reset: ({ root }) => {
    msg(root).classList.remove('is-on', 'is-answered');
    set(root, '.sk-sbtn', 'is-picked', false);
    set(root, '.sk-sbtn', 'is-pressed', false);
    set(root, '.sa__relay i', 'is-on', false);
    row(root).classList.remove('is-resolved', 'is-primary', 'is-leaving', 'is-entering');
    row(root).classList.add('is-gone');
    set(root, '[data-row="b"]', 'is-primary');
    one(root, '[data-count]').textContent = '2';
  },
  steps: [
    [
      400,
      (ctx) => {
        msg(ctx.root).classList.add('is-on');
        const a = row(ctx.root);
        flip(rows(ctx.root), () => {
          a.classList.remove('is-gone');
          a.classList.add('is-entering', 'is-primary');
          set(ctx.root, '[data-row="b"]', 'is-primary', false);
        });
        ctx.later(() => a.classList.remove('is-entering'), 40);
        swap(ctx, one(ctx.root, '[data-count]'), '3');
      },
    ],
    [2700, ({ root }) => set(root, '[data-pick]', 'is-pressed')],
    [
      2900,
      ({ root }) => {
        set(root, '[data-pick]', 'is-pressed', false);
        set(root, '[data-pick]', 'is-picked');
      },
    ],
    ...relay3(3100),
    [
      3900,
      (ctx) => {
        msg(ctx.root).classList.add('is-answered');
        flip(rows(ctx.root), () => row(ctx.root).classList.add('is-resolved'));
        swap(ctx, one(ctx.root, '[data-count]'), '2');
      },
    ],
    [4400, ({ root }) => set(root, '.sa__relay i', 'is-on', false)],
    [6200, ({ root }) => row(root).classList.add('is-leaving')],
    [
      6550,
      ({ root }) =>
        flip(rows(root), () => {
          row(root).classList.add('is-gone');
          row(root).classList.remove('is-resolved', 'is-leaving', 'is-primary');
        }),
    ],
    [6900, ({ root }) => set(root, '[data-row="b"]', 'is-primary')],
  ],
};

/** The relay's three squares, lit one after another from `at`. */
function relay3(at: number): Scene['steps'] {
  return [0, 1, 2].map((i) => [at + i * 220, ({ root }) => relay(root)[i]?.classList.add('is-on')]);
}
