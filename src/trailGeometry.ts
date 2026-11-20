import type { Box, Pt, WalkOptions } from './trailWalk';

/** Where the trail field (src/trailField.ts) may draw, measured from the page, in canvas pixels. */
export type Geometry = {
  /** The canvas's top in the document (it starts where main does) and its size in CSS pixels. */
  top: number;
  width: number;
  height: number;
  dpr: number;
  grid: number;
  area: Box;
  blocked: Box[];
  exits: WalkOptions['exits'];
  /** How many trails to keep alive at once. */
  target: number;
};

/** The dot grid's step (styles.css: the hero's background-size). */
const GRID = 20;
/** Clear space kept around the copy, the video's frame and the main trail. */
const TEXT_MARGIN = 40;
const FRAME_MARGIN = 22;
const TRAIL_MARGIN = 16;
const COPY = ['.hero__badge', '.hero h1', '.hero__lede', '.hero__actions'];

export function fieldGeometry(main: HTMLElement, canvas: HTMLCanvasElement): Geometry {
  const top = main.getBoundingClientRect().top + window.scrollY;
  const box = (r: DOMRect, m: number): Box => ({
    x0: r.left + window.scrollX - m,
    y0: r.top + window.scrollY - top - m,
    x1: r.right + window.scrollX + m,
    y1: r.bottom + window.scrollY - top + m,
  });
  const frame = document.querySelector('.shot--hero')?.getBoundingClientRect();
  const width = canvas.getBoundingClientRect().width || document.documentElement.clientWidth;
  const frameBox = frame ? box(frame, FRAME_MARGIN) : { x0: 0, y0: 0, x1: width, y1: 0 };
  const copy = COPY.flatMap((s) =>
    [...document.querySelectorAll(s)].map((el) => box(el.getBoundingClientRect(), TEXT_MARGIN)),
  );
  // The field lives in the margins: the whole column the copy stands in, from the top down to the video, stays clear.
  const column: Box[] = copy.length
    ? [{ x0: Math.min(...copy.map((b) => b.x0)), y0: 0, x1: Math.max(...copy.map((b) => b.x1)), y1: frameBox.y0 }]
    : [];
  const blocked = [...copy, ...column, frameBox, ...trailBoxes(top)];
  const nav = document.getElementById('nav');
  const bottom = frameBox.y1 + 6;
  return {
    top,
    width,
    height: bottom + GRID,
    dpr: Math.min(2, window.devicePixelRatio || 1),
    grid: GRID,
    area: { x0: 0, y0: Math.max(0, (nav?.offsetHeight ?? 0) - top), x1: width, y1: bottom },
    blocked,
    exits: { left: true, right: true, top: true, bottom: false },
    target: width < 1300 ? 3 : width < 1700 ? 4 : 5,
  };
}

/** Boxes around every segment of the main trail's svgs that are showing, so the field never crosses it. */
function trailBoxes(top: number): Box[] {
  const boxes: Box[] = [];
  for (const svg of document.querySelectorAll<SVGSVGElement>('svg.trail')) {
    const ctm = svg.getScreenCTM();
    if (!ctm || !svg.getBoundingClientRect().width) continue;
    for (const path of svg.querySelectorAll<SVGPathElement>(':scope > path')) {
      const pts = pathPoints(path.getAttribute('d') ?? '').map(([x, y]) => {
        const p = new DOMPoint(x, y).matrixTransform(ctm);
        return [p.x + window.scrollX, p.y + window.scrollY - top] as Pt;
      });
      for (let i = 0; i < pts.length; i++) {
        const [a, b] = [pts[Math.max(0, i - 1)], pts[i]];
        boxes.push({
          x0: Math.min(a[0], b[0]) - TRAIL_MARGIN,
          y0: Math.min(a[1], b[1]) - TRAIL_MARGIN,
          x1: Math.max(a[0], b[0]) + TRAIL_MARGIN,
          y1: Math.max(a[1], b[1]) + TRAIL_MARGIN,
        });
      }
    }
  }
  return boxes;
}

/** The corners of a path written only in M, H, V and h (as the trail partials are). */
function pathPoints(d: string): Pt[] {
  const pts: Pt[] = [];
  let [x, y] = [0, 0];
  for (const [, cmd, args] of d.matchAll(/([MHVh])([^MHVh]*)/g)) {
    const n = args
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (cmd === 'M') [x, y] = [n[0], n[1]];
    if (cmd === 'H') x = n[0];
    if (cmd === 'V') y = n[0];
    if (cmd === 'h') x += n[0];
    pts.push([x, y]);
  }
  return pts;
}
