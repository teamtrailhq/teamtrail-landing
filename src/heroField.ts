// The moving background behind page heroes and closing sections. The scene itself lives in src/hero/; this file
// sizes the canvas, runs the clock, pauses off-screen and holds a still frame when motion is reduced.
import { DAY, NIGHT } from './hero/common';
import { SCENES, currentScene, onSceneChange } from './hero/scenes';
import { isNight, onThemeChange } from './theme';

type Options = {
  /** The page hero: a clear middle for the copy, and the trail along the bottom. */
  clearCenter?: boolean;
  /** 0..1 overall brightness. */
  intensity?: number;
};

/** Far enough in that every scene has finished its opening and the map's trail has reached the X. */
const STILL_FRAME = 22;

export function mountHeroField(canvas: HTMLCanvasElement, opts: Options = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0;
  let h = 0;
  let start = performance.now();
  let last = 0;
  let visible = true;

  const now = () => (reduced ? STILL_FRAME : Math.max(0, (performance.now() - start) / 1000));
  const draw = () => {
    const night = isNight();
    ctx.clearRect(0, 0, w, h);
    SCENES[currentScene()].draw({
      ctx,
      w,
      h,
      t: now(),
      night,
      colors: night ? NIGHT : DAY,
      intensity: opts.intensity ?? 1,
      hero: Boolean(opts.clearCenter),
    });
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };

  onThemeChange(draw);
  onSceneChange(() => {
    start = performance.now();
    draw();
  });
  resize();
  new ResizeObserver(resize).observe(canvas);
  if (reduced) return;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  start = performance.now();
  const loop = (frame: number) => {
    requestAnimationFrame(loop);
    if (!visible || frame - last < 33) return;
    last = frame;
    draw();
  };
  requestAnimationFrame(loop);
}
