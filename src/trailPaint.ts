import type { Pt, Route } from './trailWalk';

/** One trail on the field as it stands: drawn from `tail` to `head` (pixels along it), at `alpha`. */
export type Live = {
  route: Route;
  /** Distance along the route to each of its points. */
  dists: number[];
  len: number;
  head: number;
  tail: number;
  alpha: number;
  /** Where a pulse's front is, or null when none runs. */
  pulse: number | null;
};

/** The field's colours, from the page's tokens (styles.css), and its strength against the main trail. */
export type Palette = { line: string; blaze: string; node: string; branch: string; bg: string; alpha: number };

const PULSE = 44;
const NODE = 8;

export function liveOf(route: Route): Live {
  const dists = [0];
  for (let i = 1; i < route.points.length; i++) {
    const [[ax, ay], [bx, by]] = [route.points[i - 1], route.points[i]];
    dists.push(dists[i - 1] + Math.abs(bx - ax) + Math.abs(by - ay));
  }
  return { route, dists, len: dists[dists.length - 1], head: 0, tail: 0, alpha: 1, pulse: null };
}

/** The point `d` pixels along the route. */
function pointAt(t: Live, d: number): Pt {
  const { points } = t.route;
  for (let i = 1; i < points.length; i++) {
    if (d > t.dists[i]) continue;
    const k = (d - t.dists[i - 1]) / Math.max(1, t.dists[i] - t.dists[i - 1]);
    return [
      points[i - 1][0] + (points[i][0] - points[i - 1][0]) * k,
      points[i - 1][1] + (points[i][1] - points[i - 1][1]) * k,
    ];
  }
  return points[points.length - 1];
}

/** Traces the route between two distances along it. */
function trace(ctx: CanvasRenderingContext2D, t: Live, from: number, to: number) {
  const { points } = t.route;
  ctx.beginPath();
  ctx.moveTo(...pointAt(t, from));
  for (let i = 1; i < points.length; i++) if (t.dists[i] > from && t.dists[i] < to) ctx.lineTo(...points[i]);
  ctx.lineTo(...pointAt(t, to));
  ctx.stroke();
}

function square(ctx: CanvasRenderingContext2D, [x, y]: Pt, size: number) {
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
}

/** Draws one trail: line, path not taken, junctions, destination and pulse, each once the line has reached it. */
export function paintTrail(ctx: CanvasRenderingContext2D, t: Live, c: Palette) {
  if (t.head <= t.tail) return;
  const strength = c.alpha * t.alpha;
  const { route } = t;
  ctx.lineWidth = 2;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  ctx.globalAlpha = strength;
  ctx.strokeStyle = c.line;
  trace(ctx, t, t.tail, t.head);

  if (route.branch && t.head >= t.dists[route.branch.at] && t.tail <= t.dists[route.branch.at]) {
    const from = route.points[route.branch.at];
    const grow = Math.min(1, (t.head - t.dists[route.branch.at]) / 60);
    ctx.globalAlpha = strength * 0.9;
    ctx.strokeStyle = c.branch;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(...from);
    ctx.lineTo(from[0] + (route.branch.to[0] - from[0]) * grow, from[1] + (route.branch.to[1] - from[1]) * grow);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (t.pulse !== null) {
    const front = Math.min(t.pulse, t.head);
    const back = Math.max(t.tail, t.pulse - PULSE);
    if (front > back) {
      ctx.globalAlpha = Math.min(1, strength * 1.6);
      ctx.strokeStyle = c.blaze;
      ctx.lineWidth = 2.5;
      trace(ctx, t, back, front);
    }
  }

  for (const j of route.junctions) {
    const d = t.dists[j.at];
    if (d > t.head || d < t.tail) continue;
    ctx.globalAlpha = Math.min(1, strength * 1.3);
    ctx.fillStyle = j.hollow ? c.blaze : c.node;
    square(ctx, route.points[j.at], NODE);
    if (!j.hollow) continue;
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.bg;
    square(ctx, route.points[j.at], NODE - 4);
  }

  if (route.end === 'dest' && t.head >= t.len) {
    const [x, y] = route.points[route.points.length - 1];
    ctx.globalAlpha = strength;
    ctx.fillStyle = c.blaze;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = strength * 0.5;
    ctx.strokeStyle = c.blaze;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
