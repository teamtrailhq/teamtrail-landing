export type Rgb = [number, number, number];
export type Point = [number, number];
export type Palette = { moss: Rgb; blaze: Rgb; bg: Rgb };
export type Scene = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** Seconds since the scene started. */
  t: number;
  colors: Palette;
  /** 0..1 overall brightness. */
  intensity: number;
  /** The page hero, as opposed to the quieter field behind a closing section. */
  hero: boolean;
};

export const DAY: Palette = { moss: [63, 107, 69], blaze: [200, 88, 30], bg: [243, 241, 231] };
export const NIGHT: Palette = { moss: [143, 191, 132], blaze: [232, 131, 58], bg: [16, 24, 21] };

export const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
