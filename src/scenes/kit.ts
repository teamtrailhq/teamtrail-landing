import type { SceneCtx } from './sequencer';

/** The scene's elements matching `sel`, as HTML elements. */
export const all = (root: ParentNode, sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
export const one = (root: ParentNode, sel: string) => {
  const el = root.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`scene: no ${sel}`);
  return el;
};

/** Toggles `cls` on every match of `sel` in the scene. */
export function set(root: ParentNode, sel: string, cls: string, on = true) {
  for (const el of all(root, sel)) el.classList.toggle(cls, on);
}

/** Lights the first `n` segments of a step bar and names the step. */
export function steps(bar: HTMLElement, n: number, label?: string) {
  all(bar, 'i').forEach((seg, i) => seg.classList.toggle('is-on', i < n));
  const name = bar.parentElement?.querySelector('.sk-steps__label');
  if (name && label !== undefined) name.textContent = label;
}

/** Types `text` into `el` a character at a time. */
export function type(ctx: SceneCtx, el: HTMLElement, text: string, perChar = 34) {
  el.textContent = '';
  for (let i = 1; i <= text.length; i++) ctx.later(() => (el.textContent = text.slice(0, i)), i * perChar);
}

/** Swaps a short text with a small lift, for counts and status words. */
export function swap(ctx: SceneCtx, el: HTMLElement, text: string) {
  el.classList.add('is-out');
  ctx.later(() => {
    el.textContent = text;
    el.classList.remove('is-out');
  }, 160);
}

/** Counts a number up in `el` over `ms`, in about a dozen steps. */
export function countUp(ctx: SceneCtx, el: HTMLElement, to: number, ms: number, format = (n: number) => String(n)) {
  const n = 12;
  for (let i = 1; i <= n; i++) ctx.later(() => (el.textContent = format(Math.round((to * i) / n))), (ms * i) / n);
}

/**
 * Changes the layout with `mutate`, then slides `items` from where they were to where they are now (FLIP), so rows
 * that move when one appears or leaves glide instead of jumping. Only transforms animate.
 */
export function flip(items: HTMLElement[], mutate: () => void) {
  // Rows that weren't laid out before (display: none) have nowhere to slide from; they make their own entrance.
  const before = items.map((el) => (el.offsetParent ? el.getBoundingClientRect().top : undefined));
  mutate();
  const moved = items.filter((el, i) => {
    const from = before[i];
    if (from === undefined || !el.offsetParent) return false;
    const dy = from - el.getBoundingClientRect().top;
    if (!dy) return false;
    el.style.transition = 'none';
    el.style.transform = `translateY(${dy}px)`;
    return true;
  });
  void document.body.offsetWidth;
  for (const el of moved) {
    el.style.transition = '';
    el.style.transform = '';
  }
}
