export type Rgb = [number, number, number];
export type Point = [number, number];
export type Palette = { moss: Rgb; lake: Rgb; blaze: Rgb; red: Rgb; bg: Rgb; far: Rgb; mid: Rgb; near: Rgb; sky: Rgb };
export type Scene = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** Seconds since the scene started. */
  t: number;
  colors: Palette;
  night: boolean;
  /** 0..1 overall brightness. */
  intensity: number;
  /** The page hero, as opposed to the quieter field behind a closing section. */
  hero: boolean;
};

export const DAY: Palette = {
  moss: [63, 107, 69],
  lake: [34, 98, 122],
  blaze: [200, 88, 30],
  red: [196, 48, 31],
  bg: [243, 241, 231],
  far: [190, 200, 178],
  mid: [132, 158, 128],
  near: [63, 107, 69],
  sky: [200, 88, 30],
};
export const NIGHT: Palette = {
  moss: [143, 191, 132],
  lake: [127, 195, 216],
  blaze: [232, 131, 58],
  red: [255, 107, 92],
  bg: [16, 24, 21],
  far: [52, 76, 70],
  mid: [58, 92, 74],
  near: [86, 130, 94],
  sky: [234, 226, 200],
};

export const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

/** A mountain profile at position `x`: sharp peaks over gentler ground. */
export function ridgeline(x: number, seed: number) {
  const roll = Math.sin(x * 0.9 + seed);
  const peaks = 1 - Math.abs(Math.sin(x * 0.53 + seed * 1.7));
  const detail = Math.sin(x * 2.3 + seed * 2.1);
  const shoulders = 1 - Math.abs(Math.sin(x * 1.31 + seed * 0.6));
  return 0.08 + 0.5 * peaks + 0.26 * shoulders + 0.1 * roll + 0.05 * detail;
}

/** Keeps mountains low in the middle, and lower overall on narrow screens where copy fills the width. */
export function valley(x: number, w: number) {
  const fromCentre = Math.abs(x - w / 2) / (w / 2);
  return (0.08 + 0.92 * smooth(0.3, 0.95, fromCentre)) * (w < 700 ? 0.42 : 1);
}
