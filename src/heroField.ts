// The moving background behind page heroes and closing sections. The map itself lives in src/hero/; this file
// sizes the canvas, runs the clock, pauses off-screen and holds a still frame when motion is reduced.
import { type Box, DAY, NIGHT } from './hero/common';
import { drawTopo } from './hero/topo';
import { isNight, onThemeChange } from './theme';

type Options = {
  /** The page hero: a clear middle for the copy, and the trail along the bottom. */
  clearCenter?: boolean;
  /** 0..1 overall brightness. */
  intensity?: number;
};

/** Far enough in that the trail has reached the X. */
const STILL_FRAME = 22;

/** The hero copy's extent relative to the canvas: the union of `.hero__inner`'s children, not the full-width wrap. */
function copyBox(canvas: HTMLCanvasElement, rect: DOMRect): Box | undefined {
  const kids = [...(canvas.parentElement?.querySelector('.hero__inner')?.children ?? [])];
  const boxes = kids.map((k) => k.getBoundingClientRect()).filter((r) => r.width > 0);
  if (!boxes.length) return undefined;
  return {
    left: Math.min(...boxes.map((r) => r.left)) - rect.left,
    right: Math.max(...boxes.map((r) => r.right)) - rect.left,
    bottom: Math.max(...boxes.map((r) => r.bottom)) - rect.top,
  };
}

export function mountHeroField(canvas: HTMLCanvasElement, opts: Options = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0;
  let h = 0;
  let start = performance.now();
  let last = 0;
  let visible = true;
  let content: Box | undefined;

  const now = () => (reduced ? STILL_FRAME : Math.max(0, (performance.now() - start) / 1000));
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    drawTopo({
      ctx,
      w,
      h,
      t: now(),
      colors: isNight() ? NIGHT : DAY,
      intensity: opts.intensity ?? 1,
      hero: Boolean(opts.clearCenter),
      content,
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
    content = opts.clearCenter ? copyBox(canvas, rect) : undefined;
    draw();
  };

  onThemeChange(draw);
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  // The copy can reflow without the canvas changing size (fonts arriving, the command line cycling).
  const inner = canvas.parentElement?.querySelector('.hero__inner');
  if (opts.clearCenter && inner) observer.observe(inner);
  void document.fonts?.ready.then(resize);
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
