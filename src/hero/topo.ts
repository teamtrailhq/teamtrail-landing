import { type Box, type Palette, type Point, type Rgb, type Scene, rgba } from './common';

const LEVELS = [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8];
/** The walk, in the free strip under the copy: x across the hero, y from the strip's top (0) to its bottom (1). */
const WALK_POINTS: Point[] = [
  [0.03, 0.4],
  [0.13, 0.8],
  [0.23, 0.1],
  [0.33, 0.5],
  [0.43, 1],
  [0.54, 0.55],
  [0.64, 0.9],
  [0.74, 0.15],
];
/** On narrow screens the X stays low on the right, a map mark and nowhere near where a close button sits. */
const LOW_END: Point[] = [
  [0.85, 0.5],
  [0.95, 0.25],
];
/** Margin beside the copy, in pixels, that the trail needs before it climbs to an X up the side. */
const CLIMB_ROOM = 150;
/** The strip's tallest swing, so a tall hero doesn't turn the walk into a zig-zag. */
const MAX_DEPTH = 110;
const MARKERS = [0.1, 0.26, 0.42, 0.58, 0.74];
/** Seconds to walk the trail, then how long it rests at the X before starting again. */
const WALK = 21;
const REST = 5;

function smoothPath(points: Point[], steps: number) {
  const out: Point[] = [];
  const blend = (a: number, b: number, c: number, d: number, q: number) =>
    0.5 * (2 * b + (c - a) * q + (2 * a - 5 * b + 4 * c - d) * q * q + (3 * b - a - 3 * c + d) * q * q * q);
  for (let i = 0; i < points.length - 1; i++) {
    const [a, b, c, d] = [points[i - 1] ?? points[i], points[i], points[i + 1], points[i + 2] ?? points[i + 1]];
    for (let s = 0; s < steps; s++) {
      out.push([blend(a[0], b[0], c[0], d[0], s / steps), blend(a[1], b[1], c[1], d[1], s / steps)]);
    }
  }
  return out;
}

function contourSegments(
  ctx: CanvasRenderingContext2D,
  field: Float32Array,
  cols: number,
  rows: number,
  cell: number,
  level: number,
) {
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const [a, b] = [field[j * cols + i], field[j * cols + i + 1]];
      const [c, d] = [field[(j + 1) * cols + i + 1], field[(j + 1) * cols + i]];
      const [x, y] = [i * cell, j * cell];
      const hits: Point[] = [];
      if (a < level !== b < level) hits.push([x + (cell * (level - a)) / (b - a), y]);
      if (b < level !== c < level) hits.push([x + cell, y + (cell * (level - b)) / (c - b)]);
      if (d < level !== c < level) hits.push([x + (cell * (level - d)) / (c - d), y + cell]);
      if (a < level !== d < level) hits.push([x, y + (cell * (level - a)) / (d - a)]);
      for (let h = 0; h + 1 < hits.length; h += 2) {
        ctx.moveTo(hits[h][0], hits[h][1]);
        ctx.lineTo(hits[h + 1][0], hits[h + 1][1]);
      }
    }
  }
}

function drawContours(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, color: Rgb, intensity: number) {
  const cell = w < 500 ? 20 : 15;
  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  const drift = t * 0.035;
  const field = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const [a, b] = [((i * cell) / w) * 6, ((j * cell) / h) * 4];
      field[j * cols + i] =
        Math.sin(a + drift) +
        Math.sin(b * 1.3 - drift * 1.2 + a * 0.4) +
        0.6 * Math.sin(a * 1.9 - b * 1.4 + drift * 0.7) +
        0.4 * Math.cos(b * 2.6 + a * 0.8 - drift);
    }
  }
  ctx.lineWidth = 1;
  LEVELS.forEach((level, index) => {
    ctx.strokeStyle = rgba(color, (index === 3 ? 0.6 : 0.36) * intensity);
    ctx.beginPath();
    contourSegments(ctx, field, cols, rows, cell, level);
    ctx.stroke();
  });
}

function clearMiddle(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gradient = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.1, w / 2, h * 0.42, Math.max(w * 0.42, h * 0.62));
  gradient.addColorStop(0, 'rgba(0,0,0,1)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,.95)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}

/** The trail's waypoints in pixels: along the strip under the copy, then up the right margin when there is room. */
function waypoints(w: number, h: number, content: Box): Point[] {
  const top = Math.min(content.bottom + 28, h - 40);
  const depth = Math.min(MAX_DEPTH, Math.max(16, h - 22 - top));
  const inStrip = ([x, y]: Point): Point => [x * w, top + y * depth];
  const walk = WALK_POINTS.map(inStrip);
  const margin = w - content.right;
  if (margin < CLIMB_ROOM) return [...walk, ...LOW_END.map(inStrip)];
  const x = (f: number) => content.right + margin * f;
  return [...walk, [x(0.3), top - top * 0.12], [x(0.55), top * 0.6], [x(0.7), top * 0.4]];
}

function drawTrail(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, colors: Palette, content: Box) {
  const path = smoothPath(waypoints(w, h, content), 18);
  const progress = Math.min(1, (t % (WALK + REST)) / WALK);
  const last = Math.floor(progress * (path.length - 1));
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = rgba(colors.blaze, 0.9);
  ctx.setLineDash([9, 8]);
  ctx.beginPath();
  path.slice(0, last + 1).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = rgba(colors.moss, 1);
  for (const marker of MARKERS) {
    const [x, y] = path[Math.floor(marker * (path.length - 1))];
    ctx.fillStyle = rgba(progress >= marker ? colors.moss : colors.bg, 1);
    ctx.beginPath();
    ctx.rect(x - 5, y - 5, 10, 10);
    ctx.fill();
    ctx.stroke();
  }
  if (progress < 1) {
    ctx.fillStyle = rgba(colors.blaze, 1);
    ctx.beginPath();
    ctx.arc(path[last][0], path[last][1], 5, 0, Math.PI * 2);
    ctx.fill();
  }
  const [ex, ey] = path[path.length - 1];
  const arm = 9;
  ctx.strokeStyle = rgba(colors.blaze, progress >= 1 ? 1 : 0.55);
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(ex - arm, ey - arm);
  ctx.lineTo(ex + arm, ey + arm);
  ctx.moveTo(ex + arm, ey - arm);
  ctx.lineTo(ex - arm, ey + arm);
  ctx.stroke();
}

/** "Map": contour lines drift slowly around the headline while a dashed trail draws itself across the bottom,
 * ticking off markers until it reaches the X. Marker squares are tickets; the blaze dot is the agent walking. */
export function drawTopo({ ctx, w, h, t, colors, intensity, hero, content }: Scene) {
  drawContours(ctx, w, h, t, colors.moss, intensity);
  clearMiddle(ctx, w, h);
  if (hero) drawTrail(ctx, w, h, t, colors, content ?? { left: w * 0.2, right: w * 0.8, bottom: h * 0.75 });
}
