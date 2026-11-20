import { $$ } from './dom';

/**
 * The home hero's trail (partials/trail.html, partials/trailvideo.html) moves only while some of it can be seen:
 * once none is in view, every part gets `is-still`, which pauses its animations where they are, so nothing repaints
 * while you read further down. All parts pause and resume together, so the pulses stay in step across them and carry
 * on without a seam. Without scripts it simply keeps moving.
 */
export function initTrail() {
  const trails = $$<SVGSVGElement>('svg.trail');
  if (!trails.length || !('IntersectionObserver' in window)) return;
  const seen = new Set<Element>();
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) seen.add(entry.target);
      else seen.delete(entry.target);
    }
    for (const trail of trails) trail.classList.toggle('is-still', seen.size === 0);
  });
  for (const trail of trails) io.observe(trail);
}
