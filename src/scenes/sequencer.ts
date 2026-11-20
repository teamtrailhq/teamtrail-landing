/**
 * The scene sequencer: a loop of timed steps that add and remove classes, so CSS does the motion (transforms and
 * opacity). A scene's markup is its still frame, what shows without scripts or with reduced motion; `reset` sets the
 * loop's first frame and the steps walk it back to the still. A scene plays only while it is on screen and the tab
 * is showing.
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

export function runScene(root: HTMLElement, scene: Scene) {
  let timers: number[] = [];
  let playing = false;
  let onScreen = false;
  const ctx: SceneCtx = {
    root,
    later: (fn, ms) => void timers.push(window.setTimeout(fn, ms)),
  };

  const schedule = () => {
    for (const [at, run] of scene.steps) ctx.later(() => run(ctx), at);
    ctx.later(next, scene.length);
  };
  const next = () => {
    if (!scene.fade) {
      instantly(root, () => scene.reset(ctx));
      return schedule();
    }
    root.classList.add('is-leaving');
    ctx.later(() => {
      instantly(root, () => scene.reset(ctx));
      root.classList.remove('is-leaving');
      schedule();
    }, FADE_MS);
  };

  const play = () => {
    if (playing) return;
    playing = true;
    instantly(root, () => scene.reset(ctx));
    // A frame on the first state before the steps start, so the first one animates.
    ctx.later(schedule, 60);
  };
  const stop = () => {
    playing = false;
    timers.forEach(clearTimeout);
    timers = [];
    root.classList.remove('is-leaving');
  };
  const update = () => (onScreen && !document.hidden ? play() : stop());

  root.classList.add('sk-live');
  instantly(root, () => scene.reset(ctx));
  new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    },
    { threshold: 0.2 },
  ).observe(root);
  document.addEventListener('visibilitychange', update);
}
