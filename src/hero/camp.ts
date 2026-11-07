import { type Scene, ridgeline, rgba, seeded, smooth, valley } from './common';

const TEAM = [0.16, 0.2, 0.235, 0.27];
let grain: HTMLCanvasElement | undefined;

/** Specks of missing ink, so the flat shapes look printed. */
function grainTile() {
  if (grain) return grain;
  grain = document.createElement('canvas');
  grain.width = grain.height = 192;
  const tile = grain.getContext('2d');
  const r = seeded(5);
  for (let i = 0; tile && i < 650; i++) {
    tile.fillStyle = `rgba(0,0,0,${(0.3 + r() * 0.7).toFixed(2)})`;
    tile.fillRect(Math.floor(r() * 192), Math.floor(r() * 192), 1 + Math.floor(r() * 1.6), 1 + Math.floor(r() * 1.6));
  }
  return grain;
}

function drawPines(
  ctx: CanvasRenderingContext2D,
  w: number,
  ground: (x: number) => number,
  seed: number,
  size: number,
) {
  const r = seeded(seed);
  for (let i = 0; i < 30; i++) {
    const x = r() * w * 1.4 - w * 0.2;
    const tall = size * (0.6 + r() * 0.9);
    if (Math.abs(x - w / 2) / (w / 2) < 0.42) continue;
    const y = ground(x) + 2;
    ctx.beginPath();
    ctx.moveTo(x, y - tall);
    ctx.lineTo(x + tall * 0.3, y - tall * 0.45);
    ctx.lineTo(x + tall * 0.16, y - tall * 0.45);
    ctx.lineTo(x + tall * 0.38, y);
    ctx.lineTo(x - tall * 0.38, y);
    ctx.lineTo(x - tall * 0.16, y - tall * 0.45);
    ctx.lineTo(x - tall * 0.3, y - tall * 0.45);
    ctx.closePath();
    ctx.fill();
  }
}

function drawStars(ctx: CanvasRenderingContext2D, { w, h, t, colors }: Scene, rise: number) {
  const r = seeded(9);
  for (let i = 0; i < 90; i++) {
    const [x, y, speed] = [r() * w, r() * h * 0.62, 0.4 + r()];
    const twinkle = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * speed + i));
    ctx.fillStyle = rgba(colors.sky, twinkle * rise * smooth(0.25, 0.6, Math.abs(x - w / 2) / (w / 2)));
    ctx.fillRect(x, y, 1.6, 1.6);
  }
}

/** "Camp": flat printed mountains and pines, a slow sun or moon, and a small team walking the near ridge. */
export function drawCamp(scene: Scene) {
  const { ctx, w, h, t, colors, night, intensity } = scene;
  const rise = smooth(0, 2, t);
  ctx.globalAlpha = intensity;
  if (night) drawStars(ctx, scene, rise);
  if (w >= 700) {
    ctx.fillStyle = rgba(colors.sky, (night ? 0.85 : 0.75) * rise);
    ctx.beginPath();
    ctx.arc(w * 0.9, h * 0.27 - Math.sin(t * 0.03) * h * 0.03, Math.min(w, h) * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  const layer = (base: number, amp: number, freq: number, seed: number, drift: number, color: string) => {
    const ground = (x: number) =>
      h - (h * base + h * amp * ridgeline(((x + t * drift) / w) * freq, seed)) * valley(x, w) * rise - 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 6; x += 6) ctx.lineTo(x, ground(x));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    return ground;
  };
  layer(0.1, 0.78, 14, 1.2, 2, rgba(colors.far, 1));
  const midGround = layer(0.08, 0.46, 18, 3.7, -4, rgba(colors.mid, 1));
  const nearGround = layer(0.05, 0.2, 22, 6.1, 7, rgba(colors.near, 1));
  ctx.fillStyle = rgba(colors.mid, 1);
  drawPines(ctx, w, midGround, 4, h * 0.06 * rise);
  ctx.fillStyle = rgba(colors.near, 1);
  drawPines(ctx, w, nearGround, 8, h * 0.09 * rise);
  ctx.fillStyle = rgba(colors.blaze, 1);
  for (const offset of TEAM) {
    const x = w * (0.04 + ((offset + t * 0.006) % 0.32));
    const y = nearGround(x);
    if (night) {
      ctx.beginPath();
      ctx.arc(x, y - 9, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else ctx.fillRect(x - 2, y - 11, 4, 10);
  }
  ctx.globalAlpha = 1;
  const pattern = ctx.createPattern(grainTile(), 'repeat');
  if (!pattern) return;
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
}
