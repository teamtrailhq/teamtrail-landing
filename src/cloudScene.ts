import { mountScout } from '@teamtrail/scout-avatar/mount';
import { $, $$ } from './dom';

/** /cloud page art, drawn smooth like Scout's badge: clouds from a few overlapping circles on a flat base, plus a laptop and a phone. Motion is CSS, off with reduced motion. */

type Cloud = { w: number; h: number; circles: [number, number, number][]; base: [number, number, number] };
const SVG = 'http://www.w3.org/2000/svg';
const COLORS = { line: '#3a403c', top: '#eef4f4', shade: '#c5d6da' };

function cloudSvg({ w, h, circles, base: [x0, x1, baseH] }: Cloud, scale: number): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  const pad = 1;
  svg.setAttribute('viewBox', `${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`);
  svg.setAttribute('width', String((w + pad * 2) * scale));
  svg.setAttribute('height', String((h + pad * 2) * scale));
  svg.setAttribute('aria-hidden', 'true');
  const shapes = (attrs: string) =>
    circles.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs}/>`).join('') +
    `<rect x="${x0}" y="${h - baseH}" width="${x1 - x0}" height="${baseH}" rx="${baseH / 2}" ${attrs}/>`;
  const shadeY = h * 0.62;
  svg.innerHTML =
    shapes(`fill="${COLORS.line}" stroke="${COLORS.line}" stroke-width="1"`) +
    shapes(`fill="${COLORS.top}"`) +
    `<clipPath id="cloud-${w}-${h}">${shapes('')}</clipPath>` +
    `<rect x="0" y="${shadeY}" width="${w}" height="${h - shadeY}" fill="${COLORS.shade}" clip-path="url(#cloud-${w}-${h})"/>`;
  return svg;
}

/** Cloud shapes: a big one for Scout to sit on, and small ones for the sky. */
const BIG: Cloud = {
  w: 46,
  h: 17,
  circles: [
    [11, 11, 6],
    [19, 8, 7.5],
    [28, 7, 7],
    [36, 10.5, 6.5],
    [23, 12, 5],
  ],
  base: [6, 41, 6],
};
const SMALL: Cloud[] = [
  {
    w: 18,
    h: 8,
    circles: [
      [5, 5, 3],
      [10, 3.8, 3.8],
      [14, 5.2, 2.8],
    ],
    base: [2.5, 16, 3],
  },
  {
    w: 24,
    h: 9,
    circles: [
      [6, 6, 3],
      [12, 4, 4],
      [18, 5.6, 3.4],
    ],
    base: [3.5, 21, 3],
  },
  {
    w: 14,
    h: 7,
    circles: [
      [4, 4.5, 2.4],
      [8.5, 3.4, 3.2],
      [11, 4.6, 2.2],
    ],
    base: [2, 12.5, 2.5],
  },
];

const DEVICE = 'fill="#14241f" stroke="#3a403c" stroke-width="1"';
const LAPTOP = `<svg viewBox="0 0 16 11" width="96" height="66" aria-hidden="true"><rect x="2.5" y=".5" width="11" height="7.5" rx="1" ${DEVICE}/><rect x=".5" y="8" width="15" height="2.5" rx="1" fill="#2a454c" stroke="#3a403c" stroke-width="1"/></svg>`;
const PHONE = `<svg viewBox="0 0 10 16" width="60" height="96" aria-hidden="true"><rect x=".5" y=".5" width="9" height="15" rx="1.8" ${DEVICE}/><path d="M2.5 4h4M2.5 6.5h5M2.5 9h3" stroke="#6fbf8f" stroke-linecap="round"/></svg>`;

const LINES = ['Agents are on it', "I'll ping your phone", 'Close the laptop', 'Only the calls that matter'];

/** Scout with a short line every few seconds, like the nav mark. */
function talkingScout(host: HTMLElement, size: number, reducedMotion: boolean) {
  const h = mountScout(host, { size, state: 'idle', framed: false });
  if (reducedMotion) return;
  let i = 0;
  const talk = () =>
    h.update({
      speaking: LINES[i++ % LINES.length],
      onSpeakEnd: () => {
        h.update({ speaking: undefined });
        setTimeout(talk, 5200);
      },
    });
  setTimeout(talk, 1800);
}

export function initCloudScene(reducedMotion: boolean) {
  // Hero: Scout on the big cloud.
  for (const stage of $$('[data-cloud-stage]')) {
    const cloud = $('[data-cloud-big]', stage);
    if (cloud) cloud.appendChild(cloudSvg(BIG, Number(cloud.dataset.scale ?? 7)));
    const scout = $('[data-cloud-scout]', stage);
    if (scout) talkingScout(scout, Number(scout.dataset.size ?? 3), reducedMotion);
  }
  // Sky: small clouds drifting behind the copy; each element picks a shape and a size.
  for (const el of $$('[data-cloud-small]')) {
    const shape = SMALL[Number(el.dataset.cloudSmall ?? 0) % SMALL.length];
    el.appendChild(cloudSvg(shape, Number(el.dataset.scale ?? 4)));
  }
  // Journey strip: sleeping laptop → Scout's cloud → phone.
  const laptop = $('[data-px-laptop]');
  if (laptop) laptop.innerHTML = LAPTOP;
  const phone = $('[data-px-phone]');
  if (phone) phone.innerHTML = PHONE;
  const mid = $('[data-cloud-mid]');
  if (mid) mid.appendChild(cloudSvg(SMALL[1], 5));
  const midScout = $('[data-cloud-mid-scout]');
  if (midScout) mountScout(midScout, { size: 1.3, state: reducedMotion ? 'idle' : 'thinking', framed: false });
}
