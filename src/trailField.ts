import { onThemeChange } from './theme';
import { fieldGeometry, type Geometry } from './trailGeometry';
import { liveOf, paintTrail, type Live, type Palette } from './trailPaint';
import { seeded, walk } from './trailWalk';

/**
 * The home hero's trail field, on wide screens: fainter trails that keep growing in the margins around the copy
 * and the video, behind the main trail (partials/trail.html). Each one draws itself on the dot grid at a walking
 * pace, holds while a pulse runs along it, then fades or retracts, and another starts elsewhere on another route.
 * Routes come from a seeded walk (src/trailWalk.ts), so a page load always plays the same; they keep clear of the
 * copy, the video, the nav and the main trail, measured from the page and again on every resize.
 * With reduced motion it is a still set of trails, drawn once. Without scripts there is no field at all; the page
 * is complete without it. Paused while off screen.
 */
const SEED = 0x7e2a11;
const WIDE = 1100;
/** At most this many trails grow at once, so little moves at the edge of sight. */
const GROWING = 2;

type Trail = Live & {
  phase: 'grow' | 'hold' | 'fade' | 'retract';
  speed: number;
  exit: 'fade' | 'retract';
  until: number;
};

export function initTrailField(reducedMotion: boolean) {
  const main = document.querySelector<HTMLElement>('main');
  if (!main || !document.querySelector('.hero--home') || !document.querySelector('.shot--hero')) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'trail-field';
  canvas.setAttribute('aria-hidden', 'true');
  main.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let palette = readPalette();
  let geo: Geometry | null = null;
  let rand = seeded(SEED);
  let trails: Trail[] = [];
  const taken = new Set<string>();
  let nextSpawn = 0;
  let raf = 0;
  let last = 0;
  let visible = true;

  const draw = () => {
    if (!geo) return;
    ctx.setTransform(geo.dpr, 0, 0, geo.dpr, 0, 0);
    ctx.clearRect(0, 0, geo.width, geo.height);
    for (const t of trails) paintTrail(ctx, t, palette);
  };

  const spawn = (now: number, grown: boolean) => {
    if (!geo) return false;
    const route = walk({ rand, area: geo.area, blocked: geo.blocked, taken, grid: geo.grid, exits: geo.exits });
    if (!route) return false;
    for (const c of route.cells) taken.add(c);
    const live = liveOf(route);
    const speed = 120 + rand() * 80;
    const exit = rand() < 0.5 ? 'fade' : 'retract';
    trails.push({ ...live, head: grown ? live.len : 0, phase: grown ? 'hold' : 'grow', speed, exit, until: now });
    return true;
  };

  const retire = (t: Trail) => {
    for (const c of t.route.cells) taken.delete(c);
  };

  const step = (now: number, dt: number) => {
    for (const t of trails) advance(t, now, dt, rand);
    for (const t of trails.filter(done)) retire(t);
    trails = trails.filter((t) => !done(t));
    const growing = trails.filter((t) => t.phase === 'grow').length;
    if (geo && trails.length < geo.target && growing < GROWING && now >= nextSpawn) {
      spawn(now, false);
      nextSpawn = now + 900 + rand() * 2600;
    }
  };

  const frame = (now: number) => {
    const dt = Math.min(50, now - (last || now));
    last = now;
    step(now, dt);
    draw();
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  };
  const run = () => {
    if (raf || reducedMotion || !geo || !visible) return;
    raf = requestAnimationFrame(frame);
  };

  const layout = () => {
    stop();
    const wide = window.innerWidth >= WIDE;
    canvas.classList.toggle('is-off', !wide);
    geo = wide ? fieldGeometry(main, canvas) : null;
    trails = [];
    taken.clear();
    rand = seeded(SEED);
    if (!geo) return;
    canvas.style.top = `${geo.top}px`;
    canvas.style.height = `${geo.height}px`;
    canvas.width = Math.round(geo.width * geo.dpr);
    canvas.height = Math.round(geo.height * geo.dpr);
    if (reducedMotion) {
      for (let i = 0; i < geo.target + 1; i++) spawn(0, true);
      for (const t of trails) t.pulse = null;
      draw();
      return;
    }
    nextSpawn = performance.now() + 1200;
    run();
  };

  let pending = 0;
  const relayout = () => {
    window.clearTimeout(pending);
    pending = window.setTimeout(layout, 150);
  };
  const watched = ['.hero--home', '.hero-video'].map((s) => document.querySelector(s)).filter((e) => e !== null);
  window.addEventListener('resize', relayout);
  const sized = new ResizeObserver(relayout);
  for (const el of watched) sized.observe(el);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) run();
    else stop();
  }).observe(canvas);
  onThemeChange(() => {
    palette = readPalette();
    draw();
  });
  void document.fonts?.ready.then(relayout);
  layout();
}

function done(t: Trail) {
  return (t.phase === 'fade' && t.alpha <= 0) || (t.phase === 'retract' && t.tail >= t.len);
}

/** Moves one trail on by `dt` ms: grows, holds while its pulse runs, then fades or retracts. */
function advance(t: Trail, now: number, dt: number, rand: () => number) {
  const s = dt / 1000;
  if (t.phase === 'grow') {
    t.head = Math.min(t.len, t.head + t.speed * s);
    if (t.head < t.len) return;
    t.phase = 'hold';
    t.pulse = 0;
    t.until = now + (t.len / 240) * 1000 + 900 + rand() * 1600;
    return;
  }
  if (t.phase === 'hold') {
    if (t.pulse !== null) t.pulse += 240 * s;
    if (t.pulse !== null && t.pulse > t.len + 60) t.pulse = null;
    if (now >= t.until) t.phase = t.exit;
    return;
  }
  if (t.phase === 'fade') t.alpha = Math.max(0, t.alpha - s / 1.6);
  else t.tail = Math.min(t.len, t.tail + t.speed * s);
}

/** The field's colours from the page's tokens: about half the main trail's strength. */
function readPalette(): Palette {
  const root = getComputedStyle(document.documentElement);
  const token = (name: string) => root.getPropertyValue(name).trim();
  const main = document.querySelector('svg.trail');
  const strength = main ? parseFloat(getComputedStyle(main).getPropertyValue('--trail-alpha')) : NaN;
  return {
    line: token('--accent'),
    blaze: token('--fill'),
    node: token('--text-hi'),
    branch: token('--faint'),
    bg: token('--bg'),
    alpha: 0.5 * (Number.isFinite(strength) ? strength : 0.7),
  };
}
