import { one, set, steps } from './kit';
import type { Scene, SceneCtx } from './sequencer';

/**
 * Agents in parallel: claude-02 and codex-01 each claim a ticket and work through its steps; Teamtrail warns that both
 * touch the same file, and codex-01 moves to another ticket. The still is the warning, before codex-01 moves.
 */
type Id = 'a' | 'b';
const agent = (root: HTMLElement, id: Id) => one(root, `[data-agent="${id}"]`);
const bar = (root: HTMLElement, id: Id) => one(agent(root, id), '.sk-steps');

function claim({ root }: SceneCtx, id: Id, key: string, title: string) {
  const el = agent(root, id);
  one(el, '.sk-key').textContent = key;
  one(el, '.sk-agent__title').textContent = title;
  el.classList.add('is-claimed');
  one(el, '.sk-agent__state').classList.add('is-live');
  steps(bar(root, id), 1, 'Read 1/5');
}

function worked({ root }: SceneCtx, id: Id, text: string, file: string, step: number) {
  const el = agent(root, id);
  one(el, '.par__worked').textContent = text;
  one(el, '.sk-agent__files span').textContent = file;
  el.classList.add('is-worked');
  steps(bar(root, id), step, `Work ${step}/5`);
}

export const parallelScene: Scene = {
  length: 10000,
  fade: true,
  still: 5000,
  reset: ({ root }) => {
    for (const id of ['a', 'b'] as const) {
      const el = agent(root, id);
      el.classList.toggle('is-claimed', false);
      el.classList.toggle('is-worked', false);
      el.classList.toggle('is-moving', false);
      one(el, '.sk-agent__state').classList.toggle('is-live', false);
      steps(bar(root, id), 0, 'Read 0/5');
    }
    set(root, '.sk-agent__files', 'is-overlap', false);
    set(root, '.par__overlap', 'is-on', false);
  },
  steps: [
    [500, (ctx) => claim(ctx, 'a', '#4', 'Queue edits while offline')],
    [1100, (ctx) => claim(ctx, 'b', '#5', 'Add a sync_failures table')],
    [1900, (ctx) => worked(ctx, 'a', 'Worked for 12 sec', 'src/sync/merge.ts', 2)],
    [2500, (ctx) => worked(ctx, 'b', 'Worked for 9 sec', 'src/sync/merge.ts', 2)],
    [
      3300,
      ({ root }) => {
        set(root, '.sk-agent__files', 'is-overlap');
        set(root, '.par__overlap', 'is-on');
      },
    ],
    [3900, ({ root }) => steps(bar(root, 'a'), 3, 'Work 3/5')],
    [5300, ({ root }) => agent(root, 'b').classList.add('is-moving')],
    [
      5800,
      (ctx) => {
        const b = agent(ctx.root, 'b');
        b.classList.toggle('is-worked', false);
        claim(ctx, 'b', '#7', 'Show sync status in the note list');
        b.classList.toggle('is-moving', false);
        set(ctx.root, '.par__overlap', 'is-on', false);
        set(ctx.root, '.sk-agent__files', 'is-overlap', false);
      },
    ],
    [6700, (ctx) => worked(ctx, 'b', 'Worked for 4 sec', 'src/ui/NoteList.tsx', 2)],
    [7400, ({ root }) => steps(bar(root, 'a'), 4, 'Check 4/5')],
  ],
};
