import type { Player } from './turns';

/**
 * The scene sequencer: a loop of timed steps that add and remove classes, so CSS does the motion (transforms and
 * opacity). A scene's markup is its still frame, what shows without scripts, with reduced motion and while another
 * scene has its turn (./turns). A turn starts on the still, plays round the loop and comes back to it: `reset` sets
 * the loop's first frame and the steps walk it on.
 */
export interface SceneCtx {
  root: HTMLElement;
  /** Runs `fn` after `ms`, cancelled when the scene stops. */
  later(fn: () => void, ms: number): void;
}

export interface Scene {
  /** Loop length in ms, from the first frame to the next. */
  length: number;
  /** Fade the stage out and in between loops; off for scenes whose last frame is their first. */
  fade?: boolean;
  /** Where in the loop the still frame is: the steps before it make the still. Defaults to the loop's end. */
  still?: number;
  reset(ctx: SceneCtx): void;
  steps: Array<[at: number, run: (ctx: SceneCtx) => void]>;
}

const FADE_MS = 450;

/** Applies `fn` with transitions off, so a reset jumps instead of animating back. */
function instantly(root: HTMLElement, fn: () => void) {
  root.classList.add('sk-instant');
  fn();
  void root.offsetWidth;
  root.classList.remove('sk-instant');
}

/** A scene on `root` that plays a turn when asked, and otherwise shows its still frame. */
export function scenePlayer(root: HTMLElement, scene: Scene): Player {
  const stillFrame = root.innerHTML;
  const stillAt = scene.still ?? scene.length;
  let timers: number[] = [];
  const ctx: SceneCtx = { root, later: (fn, ms) => void timers.push(window.setTimeout(fn, ms)) };

  /** Puts the looping scene where its still frame is, at once: it looks the same, and the steps can go on from it. */
  const toStill = () =>
    instantly(root, () => {
      const now: SceneCtx = { root, later: (fn) => fn() };
      root.classList.add('sk-live');
      scene.reset(now);
      for (const [at, run] of scene.steps) if (at < stillAt) run(now);
    });

  /** Back to the markup as written, the frame every scene shows when it isn't playing. */
  const stop = () => {
    timers.forEach(clearTimeout);
    timers = [];
    root.classList.remove('sk-live', 'is-leaving');
    root.innerHTML = stillFrame;
  };

  const play = (done: () => void) => {
    toStill();
    // From the still to the loop's end, the restart (faded or not), then the steps that lead back to the still.
    for (const [at, run] of scene.steps) if (at >= stillAt) ctx.later(() => run(ctx), at - stillAt);
    const restart = scene.length - stillAt;
    const fade = scene.fade ? FADE_MS : 0;
    if (scene.fade) ctx.later(() => root.classList.add('is-leaving'), restart);
    ctx.later(() => {
      instantly(root, () => scene.reset(ctx));
      root.classList.remove('is-leaving');
    }, restart + fade);
    for (const [at, run] of scene.steps) if (at < stillAt) ctx.later(() => run(ctx), restart + fade + at);
    ctx.later(
      () => {
        stop();
        done();
      },
      restart + fade + stillAt,
    );
  };

  return { root, play, stop };
}
