// /mobile's share image, public/media/brand/og-mobile-1200x630.png: the night dot grid, the wordmark, the headline and
// the hero scene's phone with Needs you filled, rendered from the built page itself (the real scene markup and CSS), so
// it follows the page when the scene changes.
//   npm run build && npm run preview -- --port 4319
//   BASE=http://localhost:4319 npm run og:mobile
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

const BASE = (process.env.BASE ?? 'http://localhost:4319').replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = resolve(import.meta.dirname, '../public/media/brand/og-mobile-1200x630.png');
const W = 1200;
const H = 630;

const browser = await chromium.launch({ executablePath: CHROME });
const context = await browser.newContext({ viewport: { width: W, height: H }, reducedMotion: 'reduce' });
await context.addInitScript(() => localStorage.setItem('teamtrail-theme', 'night'));
const page = await context.newPage();
await page.goto(`${BASE}/mobile/`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);

await page.evaluate(
  ({ W, H }) => {
    const el = (tag, cls, text) => {
      const n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text) n.textContent = text;
      return n;
    };
    // The phone from the hero, with the question in the list and the notification gone: Needs you, filled.
    const device = document.querySelector('[data-scene="mobile-needs"] .device').cloneNode(true);
    device.querySelector('.ip__note').classList.remove('is-on');
    device.querySelector('[data-q]').classList.add('is-on');
    device.querySelector('.ip__count .sk-num').textContent = '4';
    Object.assign(device.style, {
      top: '46px',
      left: 'auto',
      right: '96px',
      marginLeft: '0',
      transform: 'scale(0.86)',
    });
    device.style.transformOrigin = 'top right';

    const scene = el('figure', 'scene');
    const stage = el('div', 'sk-stage');
    Object.assign(scene.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '99999',
      margin: '0',
      background: 'var(--bg)',
    });
    Object.assign(stage.style, { width: `${W}px`, height: `${H}px` });
    for (const [k, v] of Object.entries({ '--sk-fade-x': '0%', '--sk-fade-top': '0%', '--sk-fade-bottom': '0%' }))
      stage.style.setProperty(k, v);

    const copy = el('div');
    Object.assign(copy.style, {
      position: 'absolute',
      left: '84px',
      top: '0',
      bottom: '0',
      width: '600px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: '26px',
    });
    const word = document.querySelector('.footer .brand__word').cloneNode(true);
    Object.assign(word.style, { position: 'absolute', left: '84px', top: '56px', fontSize: '26px' });
    const label = el('span', '', 'Teamtrail for iPhone · coming with Cloud');
    Object.assign(label.style, {
      font: '500 19px/1.3 var(--code)',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--accent)',
    });
    const title = el('b', '', "Your trails, while you're away.");
    Object.assign(title.style, {
      font: '600 68px/1.04 var(--sans)',
      letterSpacing: '-0.035em',
      color: 'var(--text-hi)',
    });
    const line = el('span', '', 'Notified only for the calls that are yours.');
    Object.assign(line.style, { font: '400 25px/1.35 var(--sans)', color: 'var(--text)' });
    copy.append(label, title, line);

    stage.append(word, copy, device);
    scene.append(stage);
    document.body.append(scene);
  },
  { W, H },
);
await page.waitForTimeout(300);
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();
console.log(`wrote ${OUT}`);
