import { $, $$ } from './dom';

export function initReveal(reducedMotion: boolean) {
  const items = $$('.reveal');
  const siblingsIndex = new Map<Element, number>();
  for (const el of items) {
    const parent = el.parentElement;
    if (!parent) continue;
    const i = siblingsIndex.get(parent) ?? 0;
    (el as HTMLElement).style.setProperty('--i', String(Math.min(i, 6)));
    siblingsIndex.set(parent, i + 1);
  }
  const title = $('.hero__title');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    title?.classList.add('is-in');
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => io.observe(el));
  requestAnimationFrame(() => title?.classList.add('is-in'));
}
