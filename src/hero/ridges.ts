import { type Scene, ridgeline, rgba, smooth, valley } from './common';

const HIKERS = [0.05, 0.11, 0.17, 0.24, 0.76, 0.83, 0.89, 0.95];
const FLOOR = 6;

/** "Ridges": columns of short dashes stacked into mountains. Lit dashes on the near ridge are tickets being
 * worked on (blaze) or ready (lake), and one red dash blinks when someone is waiting on you. */
export function drawRidges({ ctx, w, h, t, colors, intensity }: Scene) {
  const narrow = w < 500;
  const [barW, gap, pitch, barH] = narrow ? [7, 3, 5, 2] : [12, 5, 7, 3];
  const count = Math.ceil(w / (barW + gap)) + 1;
  const left = (w - count * (barW + gap) + gap) / 2;
  const grow = smooth(0, 1.6, t);
  const lit = HIKERS.map((o, k) => Math.floor(((o + Math.sin(t * 0.05 + k) * 0.03) % 1) * count));
  const blinker = Math.round(count * 0.86);
  for (let i = 0; i < count; i++) {
    const x = left + i * (barW + gap);
    const shape = valley(x + barW / 2, w) * grow * h;
    const f = (x / w) * 11;
    const far = (0.16 + 0.62 * ridgeline(f + t * 0.012, 1.2)) * shape;
    const mid = (0.1 + 0.46 * ridgeline(f * 1.2 - t * 0.02, 3.7)) * shape;
    const near = (0.06 + 0.3 * ridgeline(f * 1.5 + t * 0.03, 6.1)) * shape;
    const top = Math.max(far, mid, near);
    for (let r = 0; r * pitch < top; r++) {
      const height = r * pitch;
      const wave = 0.5 + 0.5 * Math.sin(t * 0.7 + i * 0.5 - r * 0.08);
      const [color, alpha] =
        height < near
          ? [colors.near, 0.5 + 0.45 * wave]
          : height < mid
            ? [colors.mid, 0.42 + 0.3 * wave]
            : [colors.far, 0.55 + 0.3 * wave];
      ctx.fillStyle = rgba(color, alpha * intensity);
      ctx.fillRect(x, h - height - barH - FLOOR, barW, barH);
    }
    if (shape / h < 0.2) continue;
    lit.forEach((column, k) => {
      if (column !== i) return;
      ctx.fillStyle = rgba(k % 3 === 1 ? colors.lake : colors.blaze, 0.95 * grow * intensity);
      ctx.fillRect(x, h - near - barH - FLOOR - pitch, barW, barH);
      ctx.fillRect(x, h - near - barH - FLOOR - pitch * 2, barW, barH);
    });
    if (i === blinker) {
      ctx.fillStyle = rgba(colors.red, (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 3))) * grow * intensity);
      ctx.fillRect(x, h - top - barH - FLOOR - pitch * 2, barW, barH);
    }
  }
}
