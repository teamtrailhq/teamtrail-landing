// Re-captures the lookout screenshots in public/media/ from the real app, on a real project: the dev
// seed in a git repo, the built `teamtrail` server, and real MCP agents working it (lib/realProject.mjs).
// Run: npm run build -w teamtrail in ../teamtrail (once), then `npm run media` here (THEME=night for the night set).
// Env: CHROME_PATH (default /usr/local/bin/google-chrome).
import { execFileSync } from 'node:child_process';
import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { clippedCards, frameMap as frame, mapFrame } from './lib/frameMap.mjs';
import { realProject } from './lib/realProject.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// THEME=night captures into public/media/night/; the site swaps them in with the theme (src/theme.ts).
const night = process.env.THEME === 'night';
const media = join(root, night ? 'public/media/night' : 'public/media');
mkdirSync(media, { recursive: true });
const colorScheme = night ? 'dark' : 'light';
// Three agents, so the map has work in flight while one of them waits on you.
const project = await realProject({ agents: 3 });
// Always end the server and agents and delete the project, even when a step fails.
process.on('exit', () => project.stop());
const size = { width: 1680, height: 945 };
// The map close-ups use a bigger window, so four columns of the trail fit at a size you can read.
const mapSize = { width: 1920, height: 1080 };

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/local/bin/google-chrome' });
// 2x pixels so the zoomed crops stay sharp; full-app shots are saved at 1x.
const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 2, colorScheme });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));

const wait = (ms, p = page) => p.waitForTimeout(ms);
// The one-time dialogs a trail opens with (Research is done, Destination reached) close with Escape, as a person would.
const closeOneTime = async () => {
  const d = page.locator('.scrim .dialog.brief-ready, .scrim [aria-label="Destination reached"]').first();
  if (
    await d.waitFor({ timeout: 2500 }).then(
      () => true,
      () => false,
    )
  ) {
    // A bubble open behind it can take the first Esc.
    for (let i = 0; i < 4 && (await d.count()); i++) {
      await page.keyboard.press('Escape');
      await wait(600);
    }
    await d.waitFor({ state: 'detached' });
  }
};

/** A view tab in the header: Map, Plan, Activity or Logbook. A dialog that opened meanwhile closes first, with Esc. */
const view = async (name) => {
  for (let i = 0; i < 3 && (await page.locator('.scrim').count()); i++) {
    await page.keyboard.press('Escape');
    await wait(500);
  }
  await page.locator('.view-bar').getByRole('button', { name, exact: true }).click();
};
/** The agent's question at the top of the open bubble. */
const bubbleQuestion = () => page.locator('.bubble .open-q');
/** Closes the bubble with Esc, as a person would, when one is open. */
const closeBubble = async () => {
  if (!(await page.locator('.bubble').count())) return;
  await page.keyboard.press('Escape');
  await page.locator('.bubble').waitFor({ state: 'detached', timeout: 5000 });
  await wait(400);
};
/** Opens a ticket's bubble by its title: Fit the trail, then click its card. */
const openTicket = async (title) => {
  await closeBubble();
  await page.locator('.map-zone').getByRole('button', { name: 'Fit' }).click();
  await wait(700);
  await page.locator('.map-zone .node', { hasText: title }).first().click();
  await page.locator('.bubble').waitFor({ timeout: 15000 });
  await wait(800);
};
/** The full ticket: the bubble's "Full ticket" opens the inspector as a drawer over the map. */
const fullTicket = async () => {
  await page.locator('.bubble').getByRole('button', { name: 'Full ticket' }).click();
  await page.locator('.ticket-drawer').waitFor({ timeout: 15000 });
  await wait(800);
};
/** Back from the full ticket to its bubble. */
const closeDrawer = async () => {
  await page.locator('.ticket-drawer .bubble-close').click();
  await page.locator('.ticket-drawer').waitFor({ state: 'detached', timeout: 5000 });
};
/** The trail bar's More (the lists under it) or Less; the choice stays in this browser. */
const trailBarMore = async (more) => {
  const button = page.locator('.trail-bar').getByRole('button', { name: more ? 'More' : 'Less', exact: true });
  if (await button.count()) await button.click();
  await page.locator('.trail-lists').waitFor({ state: more ? 'visible' : 'detached', timeout: 10000 });
  await wait(600);
};

const setVisible = (v) =>
  page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'visible' : 'hidden') });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => !v });
    document.dispatchEvent(new Event('visibilitychange'));
  }, v);

/**
 * Before any shot: the pointer parked in a neutral corner, focus dropped, no tooltip (the plain one or Scout's speech
 * bubble, both `[role=tooltip]`) left open, web fonts loaded and fades finished.
 */
const clearUi = async () => {
  const vp = page.viewportSize();
  await page.mouse.move(vp.width - 2, vp.height - 2);
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await page.locator('[role="tooltip"], .tooltip, .scout-tip').first().waitFor({ state: 'detached', timeout: 5000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => (a.effect?.getTiming().iterations === Infinity ? 0 : a.finished))),
  );
  await wait(400);
};

/** Shrinks a 2x crop wider than `max` pixels, so the map shots stay a sensible file size: sips on macOS, else ffmpeg. */
const fit = (file, max) => {
  if (!max) return;
  if (process.platform === 'darwin') {
    execFileSync('sips', ['--resampleWidth', String(max), file], { stdio: 'ignore' });
    return;
  }
  const tmp = `${file}.fit.png`;
  execFileSync('ffmpeg', ['-y', '-i', file, '-vf', `scale=${max}:-1:flags=lanczos`, tmp], { stdio: 'ignore' });
  renameSync(tmp, file);
};

// ONLY=name,name saves just those shots (the run still walks every step before them) and ends once they're saved.
const only = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
const saved = new Set();
/** Whether this run saves `name`. */
const wanted = (name) => !only || only.has(name);
/** Notes a saved shot; with ONLY, ends the run once every one asked for is saved. */
const done = (name) => {
  saved.add(name);
  if (only && [...only].every((n) => saved.has(n))) process.exit(0);
};

const shot = async (name) => {
  if (!wanted(name)) return;
  await clearUi();
  await page.screenshot({ path: join(media, `${name}.png`), scale: 'css' });
  console.log('saved', `${name}.png`);
  done(name);
};

/** The margin of surrounding page every close-up keeps on each side of the part it shows, in CSS pixels. */
const MARGIN = 24;

/**
 * Close-up of the part a landing section talks about: the union of `sels`, whole, plus an even MARGIN of the page
 * around it on every side, widened or heightened to `aspect` (w/h) around its center (`aspect: null` keeps the
 * union's own shape). Saved at 2x (or `width` pixels wide). The part counts as everything it draws (text, rows),
 * not only its boxes. It never clips inside the part: when the part itself leaves the window it fails, so the
 * capture is fixed (a bigger window, a scroll). Where the part meets the window's own edge (the header at the top,
 * a drawer at the right), the margin is what the window has on that side: there is no page beyond it. `within`
 * keeps the crop inside a panel.
 */
const zoom = async (name, sels, { aspect = 4 / 3, width, within } = {}) => {
  if (!wanted(name)) return;
  await clearUi();
  // A selector that matches nothing (an optional neighbour) is left out of the union.
  const found = await Promise.all(
    sels.map((s) =>
      page
        .locator(s)
        .first()
        .boundingBox({ timeout: 3000 })
        .catch(() => null),
    ),
  );
  const boxes = found.filter(Boolean);
  if (!boxes.length) throw new Error(`nothing to capture for ${name}: ${sels.join(', ')}`);
  // The part's own extent: its boxes and everything drawn inside them (content can overflow its box).
  const extent = (el) => {
    const out = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    for (const n of [el, ...el.querySelectorAll('*')]) {
      if (getComputedStyle(n).visibility === 'hidden') continue;
      let { left, top, right, bottom } = n.getBoundingClientRect();
      // Only what shows: content a scrolling or clipping box (the part's own too) hides doesn't count.
      for (let a = n.parentElement; a && a !== document.body; a = a.parentElement) {
        if (getComputedStyle(a).overflow === 'visible') continue;
        const c = a.getBoundingClientRect();
        [left, top, right, bottom] = [
          Math.max(left, c.left),
          Math.max(top, c.top),
          Math.min(right, c.right),
          Math.min(bottom, c.bottom),
        ];
      }
      // The part itself cut by a scrolling box around it (a bubble taller than the map): no crop can show it whole.
      if (n === el) {
        const r = n.getBoundingClientRect();
        const sides = { left: left - r.left, top: top - r.top, right: r.right - right, bottom: r.bottom - bottom };
        const over = Object.entries(sides).filter(([, v]) => v > 1);
        if (over.length) out.cut = over.map(([k, v]) => `${k} ${Math.round(v)}px`).join(', ');
      }
      if (right - left < 1 || bottom - top < 1) continue;
      out.x0 = Math.min(out.x0, left);
      out.y0 = Math.min(out.y0, top);
      out.x1 = Math.max(out.x1, right);
      out.y1 = Math.max(out.y1, bottom);
    }
    return out;
  };
  // Playwright selectors (`>> nth=0`), so each part is found the way its box was.
  const measure = () =>
    Promise.all(
      sels.map((sel) =>
        page
          .locator(sel)
          .first()
          .evaluate(extent, null, { timeout: 3000 })
          .catch(() => null),
      ),
    );
  let extents = await measure();
  // A part a scrolling box cuts: scroll it to the middle of that box once, then measure again.
  const first = sels.findIndex((_, i) => extents[i]?.cut);
  if (first >= 0) {
    await page
      .locator(sels[first])
      .first()
      .evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await wait(700);
    extents = await measure();
    boxes.splice(
      0,
      boxes.length,
      ...(
        await Promise.all(
          sels.map((s) =>
            page
              .locator(s)
              .first()
              .boundingBox()
              .catch(() => null),
          ),
        )
      ).filter(Boolean),
    );
  }
  const cut = sels.map((sel, i) => extents[i]?.cut && `${sel} (${extents[i].cut})`).filter(Boolean);
  if (cut.length) throw new Error(`${name}: the app itself cuts ${cut.join('; ')}; use a bigger window`);
  const drawn = extents.filter(Boolean).reduce(
    (a, e) => ({
      x0: Math.min(a.x0, e.x0),
      y0: Math.min(a.y0, e.y0),
      x1: Math.max(a.x1, e.x1),
      y1: Math.max(a.y1, e.y1),
    }),
    { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity },
  );
  const part = {
    x0: Math.min(drawn.x0, ...boxes.map((b) => b.x)),
    y0: Math.min(drawn.y0, ...boxes.map((b) => b.y)),
    x1: Math.max(drawn.x1, ...boxes.map((b) => b.x + b.width)),
    y1: Math.max(drawn.y1, ...boxes.map((b) => b.y + b.height)),
  };
  const vp = page.viewportSize();
  if (part.x0 < -0.5 || part.y0 < -0.5 || part.x1 > vp.width + 0.5 || part.y1 > vp.height + 0.5) {
    const at = [part.x0, part.y0, part.x1, part.y1].map(Math.round).join(', ');
    throw new Error(`${name}: the part (${at}) doesn't fit the ${vp.width}x${vp.height} window`);
  }
  // `within`: a panel the part sits in (a drawer at the window's edge). The crop stays inside its box, so the
  // margin is the panel's own padding rather than the page behind it.
  const box = (within && (await page.locator(within).first().boundingBox())) || { x: 0, y: 0, ...vp };
  const [bx0, by0, bx1, by1] = [
    Math.max(0, box.x),
    Math.max(0, box.y),
    Math.min(vp.width, box.x + box.width),
    Math.min(vp.height, box.y + box.height),
  ];
  let x0 = Math.max(bx0, part.x0 - MARGIN);
  let y0 = Math.max(by0, part.y0 - MARGIN);
  let x1 = Math.min(bx1, part.x1 + MARGIN);
  let y1 = Math.min(by1, part.y1 + MARGIN);
  const grow = (a0, a1, len, max) => {
    const c = (a0 + a1) / 2;
    const lo = Math.min(Math.max(0, c - len / 2), max - len);
    return [Math.max(0, lo), Math.min(max, Math.max(0, lo) + len)];
  };
  const ratio = (x1 - x0) / (y1 - y0);
  if (aspect && ratio < aspect) [x0, x1] = grow(x0 - bx0, x1 - bx0, (y1 - y0) * aspect, bx1 - bx0).map((v) => v + bx0);
  else if (aspect) [y0, y1] = grow(y0 - by0, y1 - by0, (x1 - x0) / aspect, by1 - by0).map((v) => v + by0);
  // The margin shows the page around the part, but never half a line of it: a top or bottom edge that would cut
  // through a neighbour's text moves to just past that text, toward the part (never into it).
  [x0, y0, x1, y1] = await page.evaluate(
    ({ crop, part }) => {
      let [x0, y0, x1, y1] = crop;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (!t.textContent.trim()) continue;
        range.selectNodeContents(t);
        for (const r of range.getClientRects()) {
          if (!r.width || !r.height) continue;
          const inPart =
            r.left >= part.x0 - 1 && r.right <= part.x1 + 1 && r.top >= part.y0 - 1 && r.bottom <= part.y1 + 1;
          if (inPart) continue;
          const overlaps = r.right > x0 && r.left < x1 && r.bottom > y0 && r.top < y1;
          const inside = r.left >= x0 && r.right <= x1 && r.top >= y0 && r.bottom <= y1;
          if (!overlaps || inside) continue;
          if (r.top < y0 && r.bottom > y0) y0 = Math.min(r.bottom + 2, part.y0);
          if (r.bottom > y1 && r.top < y1) y1 = Math.max(r.top - 2, part.y1);
        }
      }
      return [x0, y0, x1, y1];
    },
    { crop: [x0, y0, x1, y1], part },
  );
  const clip = { x: Math.round(x0), y: Math.round(y0), width: Math.round(x1 - x0), height: Math.round(y1 - y0) };
  const file = join(media, `${name}.png`);
  await page.screenshot({ path: file, clip });
  fit(file, width);
  console.log('saved', `${name}.png`, width ? `${width}w` : `${clip.width * 2}x${clip.height * 2}`);
  done(name);
  return clip;
};

/** The shape of the map close-ups. */
const MAP_ASPECT = 16 / 10;

/**
 * A map close-up of the `pick`ed cards (see lib/frameMap.mjs): the middle of the map's own area at 16:10 (or
 * `aspect`), with no bubble open, refused when the crop cuts a card or a button covers one. Saved 1960 pixels wide.
 * A question that comes in meanwhile opens its bubble and glides the map to it, so the frame is made again then.
 */
const mapShot = async (name, pick, { fill = 0.94, aspect = MAP_ASPECT } = {}) => {
  if (!wanted(name)) return;
  let cut = [];
  for (let attempt = 0; attempt < 4; attempt++) {
    await closeBubble();
    await frameMap(pick, fill, aspect);
    await settleMap();
    await clearUi();
    if (await page.locator('.bubble').count()) continue;
    const f = await mapFrame(page, aspect);
    const clip = { x: Math.round(f.x), y: Math.round(f.y), width: Math.round(f.width), height: Math.round(f.height) };
    cut = await clippedCards(page, clip);
    if (cut.length) continue;
    const file = join(media, `${name}.png`);
    await page.screenshot({ path: file, clip });
    fit(file, 1960);
    console.log('saved', `${name}.png`, '1960w');
    done(name);
    return;
  }
  throw new Error(`${name} cuts through or covers: ${cut.join(', ') || 'a bubble kept opening'}`);
};

/**
 * A fixed-size crop for a small place on the site (a home card, a features shot): `width` x `height` CSS pixels from
 * (`x`, `y`), saved at 2x, so the day and night files are the same size and the app's text stays readable where the
 * site shows the image at about its CSS size. The crop moves up or down by a few pixels, never resizes, so its top and
 * bottom edges don't cut through a line of text.
 */
const cardShot = async (name, { x, y, width, height }) => {
  if (!wanted(name)) return;
  await clearUi();
  const vp = page.viewportSize();
  const dy = await page.evaluate(
    ({ x, y, width, height }) => {
      const rects = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        if (!t.textContent.trim()) continue;
        range.selectNodeContents(t);
        for (const r of range.getClientRects()) if (r.width && r.right > x && r.left < x + width) rects.push(r);
      }
      const cuts = (edge) => rects.some((r) => r.top < edge - 0.5 && r.bottom > edge + 0.5);
      for (let d = 0; d <= 48; d += 2)
        for (const s of d ? [-d, d] : [0]) if (!cuts(y + s) && !cuts(y + s + height)) return s;
      return 0;
    },
    { x, y, width, height },
  );
  const clip = { x: Math.round(x), y: Math.round(y + dy), width, height };
  if (clip.x < 0 || clip.y < 0 || clip.x + width > vp.width || clip.y + height > vp.height)
    throw new Error(`${name}: ${JSON.stringify(clip)} doesn't fit the ${vp.width}x${vp.height} window`);
  await page.screenshot({ path: join(media, `${name}.png`), clip });
  console.log('saved', `${name}.png`, `${width * 2}x${height * 2}`);
  done(name);
};
/** The middle of a map card, by its key (`#24`). */
const nodeCentre = (key) =>
  page.evaluate((key) => {
    const n = [...document.querySelectorAll('.map-zone .node')].find(
      (n) => n.querySelector('.key')?.textContent?.trim() === key,
    );
    const r = n.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, key);
/** The home page's "How it works" cards: 4:5, shown about 330 pixels wide. */
const CARD = { width: 380, height: 475 };

/**
 * Opens the Settings page at a section by its deep link (`?settings=<section>`, see settingsGroups.ts in the app),
 * the way the app's own links do: a pushed history entry the page reads on popstate. It scrolls the section to
 * `block` (the top, or the middle for a short section cropped with its neighbours).
 */
const openSettings = async (section, block = 'start') => {
  await page.evaluate((s) => {
    const url = new URL(location.href);
    // Already in Settings: move within it (replace the entry), so Back still returns to the Lookout.
    const open = url.searchParams.has('settings');
    url.searchParams.set('settings', s);
    if (open) history.replaceState(history.state, '', url);
    else history.pushState({ settingsPage: true }, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, section);
  await page.locator(`#settings-${section}`).waitFor({ timeout: 10000 });
  await page.locator(`#settings-${section}`).evaluate((el, b) => el.scrollIntoView({ block: b }), block);
  await wait(900);
};
/** Back to the Lookout from the Settings page. */
const closeSettings = async () => {
  await page.locator('.settings-page .back').click();
  await page.locator('.settings-page').waitFor({ state: 'detached', timeout: 10000 });
  await wait(500);
};

/**
 * Waits until the map holds still: the same cards in the same places for 1.5s, and none half-loaded (a card an
 * agent just created can show for a moment without its title, and the map shifts to make room for it).
 */
const settleMap = async () => {
  const snap = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.map-zone .node:not(.main-mark)')]
        .map((n) => {
          // The card's title, not the whole card: a working card's ring pulses and changes the card's box.
          const r = (n.querySelector('.title') ?? n).getBoundingClientRect();
          return `${Math.round(r.x)},${Math.round(r.y)}:${n.querySelector('.title')?.textContent}`;
        })
        .join('|'),
    );
  const blank = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.map-zone .node:not(.main-mark)')].some(
        (n) => !n.querySelector('.title')?.textContent?.trim() || !n.querySelector('.key')?.textContent?.trim(),
      ),
    );
  for (let t = 0; t < 60; t++) {
    const a = await snap();
    await wait(1500);
    if (a === (await snap()) && !(await blank())) return;
  }
  throw new Error('the map never settled');
};

/**
 * Frames the map (lib/frameMap.mjs) and refuses a frame that cuts a card in half. A card an agent creates while the
 * map is being framed shifts it, so a cut frame is tried again once the map holds still.
 */
const frameMap = async (pick, fill, aspect) => {
  let cut = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    await frame(page, pick, fill, aspect);
    cut = await clippedCards(page, aspect && (await mapFrame(page, aspect)));
    if (!cut.length) return;
    await settleMap();
  }
  throw new Error(`the map frame cuts through: ${cut.join(', ')}`);
};

/** Waits until the agents' output shows `text` (e.g. "asking:"), counting occurrences. */
const agentStep = async (text, times = 1) => {
  for (let t = 0; t < 240; t++) {
    if (project.agentLog().split(text).length - 1 >= times) return;
    await wait(500);
  }
  throw new Error(`agents never reached "${text}"\n${project.agentLog()}`);
};

/** Hands-off or Hands-on, from the switch in the header (saved for this person, as a click there does). */
const mode = async (name) => {
  await page.locator('.mode-switch').first().getByRole('button', { name, exact: true }).click();
  await page.locator(name === 'Hands-off' ? '.hands-off-home' : '.map-zone').waitFor({ timeout: 15000 });
  await wait(1200);
};

/** A row of Hands-off's Needs you, by its text, opened (one is open at a time). */
const openNeed = async (text) => {
  const row = page.locator('.home-needs .home-need', { hasText: text }).first();
  if (!(await row.count())) {
    const more = page.locator('.home-needs .home-more');
    if (await more.count()) await more.click();
  }
  await row.waitFor({ timeout: 30000 });
  // A click while the list re-renders (an agent's new item) can miss: click again until the row is open.
  const open = page.locator('.home-needs .home-need.open', { hasText: text });
  for (let i = 0; i < 4 && !(await open.count()); i++) {
    await row.locator('.ds-row-main').click();
    await open.waitFor({ timeout: 4000 }).catch(() => {});
  }
  await open.waitFor({ timeout: 10000 });
  await wait(900);
  return row;
};

/**
 * Hands-off, the home everyone starts on: the whole window, Needs you with the agent's question open in place, and
 * the plan to approve in one step (opened, not approved: the brief's own shots come later).
 */
const handsOffShots = async () => {
  await openNeed('Is silent auto-merge acceptable');
  await shot('lookout-hands-off');
  // Progress and Since you were away, under it. A taller window holds them whole.
  await page.setViewportSize({ ...size, height: 1700 });
  await wait(900);
  await zoom('lookout-since-away', ['.home-progress', '.home-since'], { aspect: null });
  // The plan: the brief and every ticket's criteria, approved in one step. Tall: it shows everything it approves.
  await page.setViewportSize({ ...size, height: 2600 });
  await openNeed('Approve the plan');
  await page.locator('.home-need.open .plan-approval').waitFor({ timeout: 15000 });
  // The brief and the tickets scroll in one box: show where the brief ends and the tickets' criteria begin.
  await page.locator('.home-need.open .plan-approval-items').evaluate((el) => {
    const t = el.querySelector('.plan-approval-ticket');
    if (t) el.scrollTop += t.getBoundingClientRect().top - el.getBoundingClientRect().top - 90;
  });
  await wait(900);
  await zoom('lookout-plan-approval', ['.home-need.open'], { aspect: null });
  // The home page's Hands-off card: Needs you in a phone-narrow window, the questions and a new plan open among them.
  await page.setViewportSize({ width: CARD.width, height: 1000 });
  await wait(900);
  await openNeed('Organizations already give');
  const needs = await page.locator('.home-needs').boundingBox();
  await cardShot('lookout-card-hands-off', { x: 0, y: needs.y - 16, ...CARD });
  await page.setViewportSize(size);
  await openNeed('Is silent auto-merge acceptable');
};

// A briefing needs time away: a short away threshold, then the tab hidden while the agents work.
// The app defaults to night, so ask for the theme this capture is for.
await page.addInitScript(
  (theme) => {
    const key = 'teamtrail.prefs';
    const prefs = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...prefs, theme }));
  },
  night ? 'night' : 'day',
);
await page.addInitScript(() => {
  if (sessionStorage.getItem('capture-init')) return;
  sessionStorage.setItem('capture-init', '1');
  const key = 'teamtrail.prefs';
  const prefs = JSON.parse(localStorage.getItem(key) || '{}');
  localStorage.setItem(key, JSON.stringify({ ...prefs, briefing: { enabled: true, awayMinutes: 0.05 } }));
});
await project.signIn(page);
await page.goto(project.url);
await page.locator('.dialog.onboarding').waitFor({ timeout: 20000 });
await wait(800);
await page.getByRole('button', { name: 'Get started' }).click();
// Hands-off is everyone's default; the briefing that opens on coming back is Hands-on's, so this capture starts there.
await page.locator('.hands-off-home').waitFor({ timeout: 15000 });
await mode('Hands-on');
await page.locator('.map-zone .node').first().waitFor({ timeout: 15000 });
// Away for a while: an agent asks, the others finish research, so the briefing has a morning's news to tell.
await setVisible(false);
await agentStep('asking:');
await agentStep('closed #', 2);
await wait(100000);
await setVisible(true);
await page.locator('.bf-tile').first().waitFor({ timeout: 20000 });
await wait(2500);
// Scout's summary, the stat tiles and the first lines of each list.
await zoom('lookout-briefing', ['.dialog.briefing h2', '.dialog.briefing .bf-tiles'], {
  aspect: null,
});
await page.getByRole('dialog', { name: 'While you were away' }).getByRole('button', { name: 'Dismiss' }).click();
// Hands-off, with the same news on its home: Since you were away counts from the same visit.
await mode('Hands-off');
await handsOffShots();
await mode('Hands-on');
// Back to the normal away threshold, so the briefing stays closed for the rest of the run.
await page.evaluate(() => {
  const prefs = JSON.parse(localStorage.getItem('teamtrail.prefs') || '{}');
  localStorage.setItem('teamtrail.prefs', JSON.stringify({ ...prefs, briefing: { enabled: true, awayMinutes: 15 } }));
});

// The junction's agent asked a side question first (fyi): answer it in #6's bubble, so the bubble shows the call
// that blocks the trail.
await openTicket('silent auto-merge');
if (await bubbleQuestion().filter({ hasText: 'While on' }).count()) {
  await page.locator('.bubble .suggest .chip', { hasText: 'Yes, show names' }).click();
}
await bubbleQuestion().filter({ hasText: 'Is silent auto-merge acceptable' }).waitFor({ timeout: 20000 });
// The Lookout as it opens: the map centred on what needs you, its bubble open beside the ticket, the trail bar under it.
await page.reload();
await page.locator('.node').first().waitFor({ timeout: 15000 });
await bubbleQuestion().filter({ hasText: 'Is silent auto-merge acceptable' }).waitFor({ timeout: 20000 });
await settleMap();
await shot('lookout-overview');
// The question in its bubble beside the card: who asks, what it decides, the suggested replies and an answer box.
// A taller window, so the whole bubble shows beside its card.
await page.setViewportSize({ ...size, height: 1400 });
await wait(1200);
await zoom('lookout-bubble-question', ['.map-zone .node.sel', '.bubble'], { aspect: null });
await page.setViewportSize(size);
await wait(800);

// The trail bar's More: under the map, everything that needs you, ranked, the agents at work with their models, and
// what's up next.
await trailBarMore(true);
await page.locator('.trail-lists .needs-list li.att-item').nth(3).waitFor({ timeout: 20000 });
await settleMap();
await shot('lookout-trail-bar-more');
await trailBarMore(false);

// Answer in the bubble, with a suggested reply; the agent records the decision and moves on.
await page.locator('.bubble .suggest .chip').first().click();
await agentStep('answered:');
await closeBubble();

// The map close-up (no bubble open): most of the trail, done research on the left, prototypes in progress, the decisions they unblock
// and the new plan drawn in.
await page.setViewportSize(mapSize);
await wait(800);
// Wider than the other close-ups: the whole trail is long and low.
await mapShot(
  'flow-06-first-tickets',
  {
    // #14 is the out-of-scope card below the trail: in the frame whole, clear of the Legend button.
    keys: ['#2', '#3', '#8', '#21', '#22', '#4', '#6', '#7', '#5', '#9', '#10', '#11', '#12', '#15', '#13', '#14'],
    added: true,
    destination: true,
  },
  { fill: 0.9, aspect: 2 },
);
// The home page's map card: the first stretch of the trail close up, the walked path from main, work in flight and a
// junction that needs you. The window is sized so the map's own area is the card's shape.
await page.setViewportSize({ width: 1280, height: 800 });
await wait(800);
const cardAspect = CARD.width / CARD.height;
await page.setViewportSize({ width: 1280, height: Math.ceil(800 + CARD.height + 8 - (await mapFrame(page)).height) });
await wait(800);
// Three cards of the first column, #24 in the middle: zoomed so the column's row pitch is a third of the card's height,
// which puts the crop's top and bottom edges in the gaps between rows, and the columns beside it out of the frame.
for (let attempt = 0; attempt < 4 && wanted('lookout-card-map') && !saved.has('lookout-card-map'); attempt++) {
  await closeBubble();
  await settleMap();
  await page.locator('.map-zone').getByRole('button', { name: 'Fit' }).click();
  await wait(900);
  // The map eases its zoom, so a wheel turn lands short: measure the row pitch and turn again until it's right.
  const pitch = () =>
    page.evaluate(() => {
      const top = (key) =>
        [...document.querySelectorAll('.map-zone .node')]
          .find((n) => n.querySelector('.key')?.textContent?.trim() === key)
          ?.getBoundingClientRect().top;
      return top('#24') - top('#23');
    });
  for (let pass = 0; pass < 5; pass++) {
    const k = CARD.height / 3 / (await pitch());
    if (Math.abs(k - 1) < 0.01) break;
    const at = await nodeCentre('#24');
    await page.mouse.move(at.x, at.y);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -Math.log(k) / 0.0015 / 6);
      await wait(80);
    }
    await wait(900);
  }
  // Then drag #24 to the middle of the map.
  const area = await mapFrame(page, cardAspect);
  const now = await nodeCentre('#24');
  const grab = await page.evaluate((a) => {
    for (let fy = 0.1; fy < 1; fy += 0.1)
      for (let fx = 0.1; fx < 1; fx += 0.1) {
        const p = { x: a.x + a.width * fx, y: a.y + a.height * fy };
        const el = document.elementFromPoint(p.x, p.y);
        if (el?.closest('.map-zone svg.graph') && !el.closest('.node, button, a, .bubble')) return p;
      }
    return null;
  }, area);
  if (!grab) continue;
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(grab.x + area.x + area.width / 2 - now.x, grab.y + area.y + area.height / 2 - now.y, {
    steps: 12,
  });
  await page.mouse.up();
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  await wait(900);
  await settleMap();
  await clearUi();
  if (await page.locator('.bubble').count()) continue;
  const f = await mapFrame(page, cardAspect);
  const mid = await nodeCentre('#24');
  // `main` sits just left of the column: start the crop past it, so its lines lead in from the edge.
  const mainRight = await page.evaluate(
    () => document.querySelector('.map-zone .node.main-mark')?.getBoundingClientRect().right,
  );
  const left = Math.max(mid.x - CARD.width / 2, (mainRight ?? -Infinity) + 10);
  const clip = {
    x: Math.round(Math.min(Math.max(left, f.x), f.x + f.width - CARD.width)),
    y: Math.round(Math.min(Math.max(mid.y - CARD.height / 2, f.y), f.y + f.height - CARD.height)),
    ...CARD,
  };
  const cut = await clippedCards(page, clip);
  if (cut.length) {
    console.log('map card cuts', cut.join(', '), JSON.stringify({ clip, f, mid, mainRight }));
    if (process.env.DEBUG_DIR) await page.screenshot({ path: join(process.env.DEBUG_DIR, `map-cut-${attempt}.png`) });
    continue;
  }
  await cardShot('lookout-card-map', clip);
}
// The home page's parallel card: Activity's agents on tickets, each with its ticket, model and step, in a phone-narrow
// window.
if (wanted('lookout-card-parallel')) {
  await view('Activity');
  await page.setViewportSize({ width: CARD.width, height: 1300 });
  await page.locator('.sessions-head').waitFor({ timeout: 10000 });
  await wait(1500);
  const sessions = await page.locator('.sessions-head').boundingBox();
  await cardShot('lookout-card-parallel', { x: 0, y: sessions.y - 16, ...CARD });
  await page.setViewportSize(size);
  await view('Map');
  await page.locator('.map-zone .node').first().waitFor({ timeout: 15000 });
}
await page.setViewportSize(size);
await wait(800);

await page.locator('.trail-btn').click();
// No hover tip over the menu.
await page.mouse.move(size.width / 2, size.height - 4);
await wait(1200);
// The menu under the title it opens from, project name included.
await zoom('lookout-trails', ['.h-title', '.trail-menu'], { aspect: 16 / 10 });
await page.getByRole('menuitem', { name: '+ New trail' }).click();
// New trail is a document editor: a markdown destination, assumptions one per line, and notes loaded from a spec.
await page.locator('.dialog.new-trail').waitFor();
const newTrail = page.locator('.dialog.new-trail');
await newTrail.locator('.new-trail-title input').fill('Ship team workspaces');
await newTrail
  .locator('.doc-destination textarea')
  .fill(
    'Teams share notebooks with roles, and admins manage members without contacting support.\n\n' +
      '- Owners, editors and viewers per notebook\n- Admins invite and remove members themselves',
  );
await newTrail.locator('.doc-assumptions textarea').fill('Existing SSO covers every team\nNo billing changes for v1');
await newTrail
  .locator('.doc-notes input[type="file"]')
  .setInputFiles(join(root, 'scripts/assets/team-workspaces-spec.md'));
await newTrail.locator('.doc-notes textarea').waitFor();
await page.waitForFunction(() => document.querySelector('.doc-notes textarea')?.value.includes('Survey'));
await wait(800);
await zoom('flow-05-new-trail', ['.dialog.new-trail'], { aspect: 16 / 10 });
await newTrail.getByRole('button', { name: 'Close', exact: true }).click();
await page.locator('.dialog.new-trail').waitFor({ state: 'detached', timeout: 5000 });
await wait(600);

// The Logbook, a page from the header's tabs: a decision with its reasoning, the facts behind it and the options it
// ruled out.
await view('Logbook');
await page.locator('.dv-row').first().waitFor({ timeout: 10000 });
await page.locator('.dv-row button', { hasText: 'CRDT vs last-write-wins' }).first().click();
await wait(1500);
await zoom('lookout-decisions', ['.dv-detail .d-head', '.dv-detail .actions'], {
  aspect: null,
});
await view('Map');
await wait(1000);

// Trail stats: the seed's finished trail gives it results from two vendors.
await page.getByRole('button', { name: /^Records/ }).click();
await page.locator('.stats-btn').click();
await page.locator('.perf-recs li').first().waitFor({ timeout: 10000 });
await wait(800);
await zoom('lookout-trail-stats', ['.perf-section >> nth=0', '.perf-section >> nth=1'], { aspect: 16 / 10 });
await page.keyboard.press('Escape');
await wait(500);

// Discovery: the plan-only trail has a brief waiting for review.
await page.locator('.trail-btn').click();
await page.getByRole('menuitem').filter({ hasText: 'Team workspaces' }).first().click();
await closeOneTime();
await page.getByRole('button', { name: 'Review brief' }).first().click({ timeout: 15000 });
await page.locator('.brief-dialog').waitFor();
await wait(800);
await zoom('lookout-discovery', ['.brief-dialog'], { aspect: 16 / 10 });
await page.keyboard.press('Escape');
await closeBubble();
await page.locator('.trail-btn').click();
await page.getByRole('menuitem').filter({ hasText: 'Offline-first' }).first().click();
await closeOneTime();
await wait(1200);
await closeBubble();

// Knowledge: everything on record, with a suggestion from a dead end open for review. A shorter window, so the
// field guide is about as tall as its list.
await page.setViewportSize({ ...size, height: 660 });
await page.getByRole('button', { name: /^Records/ }).click();
await page.locator('.knowledge-btn').click();
await page.locator('.knowledge-view').waitFor();
await page.locator('.kn-filters .chip', { hasText: 'All' }).click();
await page.locator('.knowledge-view').getByText('Silent auto-merge of shared notebooks lost edits').first().click();
await wait(800);
await zoom('lookout-knowledge', ['.knowledge-view'], { aspect: null });
await page.keyboard.press('Escape');
await page.setViewportSize(size);
await wait(500);

// A proposed new plan, drawn on the map: the cancelled ticket, the new ones and the one rewired after them.
await page.locator('.reroute-banner').waitFor({ timeout: 15000 });
await page.locator('.node.mark-added').first().waitFor({ timeout: 15000 });
await page.setViewportSize(mapSize);
await wait(800);
await mapShot('lookout-reroute-map', {
  keys: ['#5', '#9', '#10', '#11', '#12', '#15', '#13'],
  added: true,
  destination: true,
});
await page.setViewportSize(size);
await wait(800);
await page.locator('.reroute-banner').getByRole('button', { name: 'Review' }).click();
await page.locator('.reroute-dialog').waitFor();
await wait(600);
await zoom('lookout-reroute', ['.reroute-dialog'], { aspect: 16 / 10 });
await page.locator('.reroute-dialog button', { hasText: 'Close' }).click();

// What always needs you: Settings → Project → Risk policy, opened by its deep link.
await openSettings('policy');
await zoom('lookout-risk', ['#settings-policy'], { aspect: 4 / 3 });

// Settings → This trail → Model matching: the tier per ticket type, with hints from Trail stats. Switched on here (it
// starts off so the scripted agents can take every ticket, see lib/realProject.mjs).
// A taller window: the section is the group's last but one, so it can't scroll up to the top of a normal one.
await page.setViewportSize({ ...size, height: 2100 });
await openSettings('models');
await page.locator('.model-matching-toggle').click();
await page.locator('.tier-grid .tier-row').first().waitFor({ timeout: 10000 });
await wait(900);
await zoom('lookout-model-matching', ['#settings-models'], { aspect: 16 / 10 });
await page.setViewportSize(size);

// Settings → Project → Guides: Browse guides for more, then Write your own, with a team's own guide waiting for
// your approval. A taller window holds the whole section.
await page.setViewportSize({ ...size, height: 1600 });
await openSettings('guides');
await zoom('lookout-guides', ['#settings-guides .guides-foot', '#settings-guides .sp-where'], {
  aspect: null,
});
// Browse guides: the public catalog, live.
await page.setViewportSize(size);
await page.getByRole('button', { name: 'Browse guides' }).click();
await page.locator('.catalog-dialog .catalog-list li').nth(2).waitFor({ timeout: 20000 });
await wait(800);
await zoom('lookout-guide-catalog', ['.catalog-dialog'], { aspect: 16 / 10 });
await page.locator('.catalog-dialog').getByRole('button', { name: 'Close' }).click();
await wait(400);
await closeSettings();
await closeBubble();

// Parallel work: the overlap warning in Needs you (the trail bar's More), then the ticket with the files its agent
// expects to change. A tall window, so the warning and the items around it show whole.
await page.setViewportSize({ ...size, height: 1900 });
await trailBarMore(true);
const overlap = page.locator('.needs-list .att-item.k-overlap').first();
await overlap.waitFor({ timeout: 20000 });
await overlap.evaluate((el) => el.scrollIntoView({ block: 'center' }));
await wait(800);
// The warning in Needs you, whole: the list scrolls in a box too short for its neighbours as well.
await overlap.evaluate((el) => el.scrollIntoView({ block: 'nearest' }));
await wait(600);
await zoom('lookout-overlap', ['.needs-list .att-item.k-overlap'], { aspect: null });
await trailBarMore(false);
await page.setViewportSize(size);
await wait(600);
await openTicket('Show sync status');
await fullTicket();
// Its Progress: the agent's claim, its own branch and the files it said it would change.
await page.locator('.ticket-drawer .ticket-progress', { hasText: 'Changes' }).waitFor({ timeout: 15000 });
await wait(600);
await zoom('lookout-parallel-ticket', ['.ticket-drawer .ticket-head', '.ticket-drawer .ticket-progress'], {
  aspect: null,
  within: '.ticket-drawer',
});
await closeDrawer();
await closeBubble();

// All projects: this repo and billing-service (lib/realProject.mjs), with one Needs you list across them.
// 1440 wide is the smallest window that shows the list and the projects side by side.
await page.setViewportSize({ width: 1440, height: 760 });
await page.locator('.project-btn').click();
await page.locator('.trail-item.all-projects').click();
await page.locator('.projects-view .pj-item').first().waitFor({ timeout: 15000 });
await wait(1500);
await zoom('lookout-all-projects', ['.projects-view'], { aspect: null });
await page.keyboard.press('Escape');
await page.setViewportSize(size);
await wait(800);
await closeBubble();
// No hover tip or focus ring left over for the phone shot.
await clearUi();

// Phone view of the same project: the header, the map and the tab bar (Hands-on), then Hands-off's home.
const cdp = await ctx.newCDPSession(page);
const phone = async (name) => {
  if (!wanted(name)) return;
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await wait(2500);
  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 390, height: 844, scale: 1 },
  });
  writeFileSync(join(media, `${name}.png`), Buffer.from(data, 'base64'));
  console.log('saved', `${name}.png`);
  done(name);
  await cdp.send('Emulation.clearDeviceMetricsOverride');
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await wait(1200);
};
await phone('lookout-phone');
await mode('Hands-off');
await clearUi();
await phone('lookout-phone-hands-off');
await ctx.close();
await browser.close();
process.exit(0);
