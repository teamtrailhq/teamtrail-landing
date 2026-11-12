// Re-captures the lookout screenshots in public/media/ from the real app, on a real project: the dev
// seed in a git repo, the built `teamtrail` server, and real MCP agents working it (lib/realProject.mjs).
// Run: npm run build -w teamtrail in ../teamtrail (once), then `npm run media` here (THEME=night for the night set).
// Env: CHROME_PATH (default /usr/local/bin/google-chrome).
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { clippedCards, frameMap as frame } from './lib/frameMap.mjs';
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
const chip = () => page.locator('.comms .suggest .chip').first();

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

/** Shrinks a 2x crop wider than `max` pixels, so the map shots stay a sensible file size. */
const fit = (file, max) => {
  if (max) execFileSync('sips', ['--resampleWidth', String(max), file], { stdio: 'ignore' });
};

const shot = async (name) => {
  await clearUi();
  await page.screenshot({ path: join(media, `${name}.png`), scale: 'css' });
  console.log('saved', `${name}.png`);
};

/**
 * Close-up of the part a landing section talks about: the union of `sels` plus padding,
 * widened or heightened to `aspect` (w/h) around its center (`aspect: null` keeps the union's own shape), kept
 * inside the viewport. Saved at 2x (or `width` pixels wide). `top` and `bottom` override the padding above and
 * below, to stop short of whatever sits right next to the part.
 */
const zoom = async (name, sels, { aspect = 4 / 3, pad = 16, top = pad, bottom = pad, width } = {}) => {
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
  let x0 = Math.min(...boxes.map((b) => b.x)) - pad;
  let y0 = Math.min(...boxes.map((b) => b.y)) - top;
  let x1 = Math.max(...boxes.map((b) => b.x + b.width)) + pad;
  let y1 = Math.max(...boxes.map((b) => b.y + b.height)) + bottom;
  const grow = (a0, a1, len, max) => {
    const c = (a0 + a1) / 2;
    const lo = Math.min(Math.max(0, c - len / 2), max - len);
    return [Math.max(0, lo), Math.min(max, Math.max(0, lo) + len)];
  };
  const vp = page.viewportSize();
  const ratio = (x1 - x0) / (y1 - y0);
  if (aspect && ratio < aspect) [x0, x1] = grow(x0, x1, (y1 - y0) * aspect, vp.width);
  else if (aspect) [y0, y1] = grow(y0, y1, (x1 - x0) / aspect, vp.height);
  [x0, y0] = [Math.max(0, x0), Math.max(0, y0)];
  [x1, y1] = [Math.min(vp.width, x1), Math.min(vp.height, y1)];
  const clip = { x: Math.round(x0), y: Math.round(y0), width: Math.round(x1 - x0), height: Math.round(y1 - y0) };
  const file = join(media, `${name}.png`);
  await page.screenshot({ path: file, clip });
  fit(file, width);
  console.log('saved', `${name}.png`, width ? `${width}w` : `${clip.width * 2}x${clip.height * 2}`);
  return clip;
};

/** A map close-up: the map zone, refused when the crop cuts a card or a button covers one. */
const mapShot = async (name) => {
  await settleMap();
  const clip = await zoom(name, ['.map-zone'], { aspect: 16 / 10, pad: 0, width: 1960 });
  const cut = await clippedCards(page, clip);
  if (cut.length) throw new Error(`${name} cuts through or covers: ${cut.join(', ')}`);
};

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
      [...document.querySelectorAll('.map-zone .node')]
        .map((n) => {
          // The card's title, not the whole card: a working card's ring pulses and changes the card's box.
          const r = (n.querySelector('.title') ?? n).getBoundingClientRect();
          return `${Math.round(r.x)},${Math.round(r.y)}:${n.querySelector('.title')?.textContent}`;
        })
        .join('|'),
    );
  const blank = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('.map-zone .node')].some(
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
const frameMap = async (pick, fill) => {
  let cut = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    await frame(page, pick, fill);
    cut = await clippedCards(page);
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
await page.goto(project.url);
await page.locator('.dialog.onboarding').waitFor({ timeout: 20000 });
await wait(800);
await page.getByRole('button', { name: 'Get started' }).click();
await page.locator('.node').first().waitFor({ timeout: 15000 });
// Away for a while: an agent asks, the others finish research, so the briefing has a morning's news to tell.
await setVisible(false);
await agentStep('asking:');
await agentStep('closed #', 2);
await wait(100000);

await setVisible(true);
await page.locator('.bf-tile').first().waitFor({ timeout: 10000 });
await wait(2500);
// Scout's summary, the stat tiles and the first lines of each list.
await zoom('lookout-briefing', ['.dialog.briefing h2', '.dialog.briefing .bf-tiles'], {
  aspect: null,
  pad: 24,
  bottom: 12,
});
await page.getByRole('button', { name: 'Dismiss' }).click();
// Back to the normal away threshold, so the briefing stays closed for the rest of the run.
await page.evaluate(() => {
  const prefs = JSON.parse(localStorage.getItem('teamtrail.prefs') || '{}');
  localStorage.setItem('teamtrail.prefs', JSON.stringify({ ...prefs, briefing: { enabled: true, awayMinutes: 15 } }));
});
await page.reload();
await page.locator('.node').first().waitFor({ timeout: 15000 });
await wait(1500);

await page.locator('.node', { hasText: 'silent auto-merge' }).first().click();
await wait(1500);
// The whole app, with nothing open over it, the map framed so no card is cut at its edges.
await frameMap(
  { keys: ['#2', '#3', '#8', '#21', '#22', '#4', '#6', '#7', '#5', '#9', '#10', '#11'], added: true },
  0.96,
);
await settleMap();
await shot('lookout-overview');

// The map close-up: most of the trail, done research on the left, the junction waiting on you, prototypes in
// progress, the decisions they unblock and the new plan drawn in.
await page.setViewportSize(mapSize);
await wait(800);
await frameMap(
  {
    // #14 is the out-of-scope card below the trail: in the frame whole, clear of the Summary button.
    keys: ['#2', '#3', '#8', '#21', '#22', '#4', '#6', '#7', '#5', '#9', '#10', '#11', '#12', '#15', '#13', '#14'],
    added: true,
    destination: true,
  },
  0.9,
);
await mapShot('flow-06-first-tickets');
await page.setViewportSize(size);
await wait(800);

await page.locator('.trail-btn').click();
// No hover tip over the menu.
await page.mouse.move(size.width / 2, size.height - 4);
await wait(1200);
// The menu under the title it opens from, project name included.
await zoom('lookout-trails', ['.h-title', '.trail-menu'], { aspect: 16 / 10, pad: 20 });
await page.getByRole('menuitem', { name: '+ New trail' }).click();
await page.locator('.dialog').waitFor();
const fields = page.locator('.dialog input, .dialog textarea');
await fields.nth(0).fill('Ship team workspaces');
await fields.nth(1).fill('Teams share notebooks with roles, and admins manage members without contacting support.');
await fields
  .nth(2)
  .pressSequentially('Admins asked for this in the Q3 survey. Must work with existing SSO.', { delay: 18 });
await wait(600);
await zoom('flow-05-new-trail', ['.dialog'], { aspect: 16 / 10 });
await page.keyboard.press('Escape');
await wait(600);

// Everything that needs you, ranked: questions, the new plan, the brief, a risky change, knowledge to review.
// A taller window shows more of the list.
await page.locator('.attention-queue .att-item.k-question').first().waitFor({ timeout: 20000 });
await page.setViewportSize({ ...size, height: 1100 });
await wait(1200);
await zoom('lookout-queue', ['.inbox-part'], { aspect: null, pad: 0 });
await page.setViewportSize(size);
await wait(600);

await page.locator('.att-item.k-question:not(.u-fyi) > button').first().click();
await chip().waitFor({ timeout: 20000 });
await wait(1500);
await zoom('flow-07-waiting-on-you', ['.inbox .comms'], { aspect: 16 / 10 });
await chip().click();
await agentStep('asking:', 2);
await page.locator('.att-item.k-question:not(.u-fyi) > button').first().click();
await chip().waitFor({ timeout: 20000 });
await wait(1500);
// A taller window shows the whole conversation: the question, the suggested replies and the answer box.
await page.setViewportSize({ ...size, height: 1200 });
await wait(800);
await zoom('lookout-hitl-conversation', ['.comms .msg.open-q', '.comms .comms-input'], {
  aspect: null,
  pad: 10,
  top: 14,
  bottom: 14,
});
await page.setViewportSize(size);
await wait(500);

// The Logbook: a decision with its reasoning, the facts behind it and the options it ruled out.
await page.getByRole('button', { name: /^Records/ }).click();
await page.locator('.decisions-btn').click();
await page.locator('.dv-row').first().waitFor({ timeout: 10000 });
await page.locator('.dv-row button', { hasText: 'CRDT vs last-write-wins' }).first().click();
await wait(1500);
await zoom('lookout-decisions', ['.dv-detail .d-head', '.dv-detail .actions'], {
  aspect: null,
  pad: 24,
  top: 10,
  bottom: 12,
});
await page.getByRole('button', { name: /^Records/ }).click();
await page.locator('.decisions-btn').click();
await wait(1500);

// Trail stats: the seed's finished trail gives it results from two vendors.
await page.getByRole('button', { name: /^Records/ }).click();
await page.locator('.stats-btn').click();
await page.locator('.perf-recs li').first().waitFor({ timeout: 10000 });
await wait(800);
await zoom('lookout-trail-stats', ['.perf-section >> nth=0', '.perf-section >> nth=1'], { aspect: 16 / 10, pad: 24 });
await page.keyboard.press('Escape');
await wait(500);

// Discovery: the plan-only trail has a brief waiting for review. A ticket is open behind it, as you'd have it.
await page.locator('.trail-btn').click();
await page.getByRole('menuitem').filter({ hasText: 'Team workspaces' }).first().click();
await page.locator('.node', { hasText: 'Which roles' }).first().click({ timeout: 15000 });
await wait(800);
await page.getByRole('button', { name: 'Review brief' }).click({ timeout: 15000 });
await page.locator('.brief-dialog').waitFor();
await wait(800);
await zoom('lookout-discovery', ['.brief-dialog'], { aspect: 16 / 10, pad: 24 });
await page.keyboard.press('Escape');
await page.locator('.trail-btn').click();
await page.getByRole('menuitem').filter({ hasText: 'Offline-first' }).first().click();
await wait(1200);

// Knowledge: everything on record, with a suggestion from a dead end open for review. A shorter window, so the
// field guide is about as tall as its list.
await page.setViewportSize({ ...size, height: 660 });
await page.getByRole('button', { name: /^Records/ }).click();
await page.locator('.knowledge-btn').click();
await page.locator('.knowledge-view').waitFor();
await page.locator('.kn-filters .chip', { hasText: 'All' }).click();
await page.locator('.knowledge-view').getByText('Silent auto-merge of shared notebooks lost edits').first().click();
await wait(800);
await zoom('lookout-knowledge', ['.knowledge-view'], { aspect: null, pad: 0 });
await page.keyboard.press('Escape');
await page.setViewportSize(size);
await wait(500);

// Acceptance criteria on a ticket, with the knowledge it brings.
await page.locator('.node', { hasText: 'Instrument current' }).first().click();
await page.locator('.criteria-section').waitFor({ timeout: 15000 });
// A taller window, so the ticket shows whole down to its criteria (they sit under the description and the guide).
await page.setViewportSize({ ...size, height: 1500 });
await wait(1000);
await zoom('lookout-criteria', ['.inspector .zone-title', '.inspector .criteria-section'], { aspect: null, pad: 0 });
// The same ticket asks for the QA guide: the guide and the agent's checklist answers, under the ticket's title.
await zoom('lookout-ticket-guide', ['.inspector .zone-title', '.inspector .ticket-guide'], { aspect: null, pad: 0 });
await page.setViewportSize(size);
await wait(600);

// A proposed new plan, drawn on the map: the cancelled ticket, the new ones and the one rewired after them.
await page.locator('.reroute-banner').waitFor({ timeout: 15000 });
await page.locator('.node.mark-added').first().waitFor({ timeout: 15000 });
await page.setViewportSize(mapSize);
await wait(800);
await frameMap({ keys: ['#5', '#9', '#10', '#11', '#12', '#15', '#13'], added: true, destination: true });
await mapShot('lookout-reroute-map');
await page.setViewportSize(size);
await wait(800);
await page.locator('.reroute-banner button').first().click();
await page.locator('.reroute-dialog').waitFor();
await wait(600);
await zoom('lookout-reroute', ['.reroute-dialog'], { aspect: 16 / 10, pad: 24 });
await page.locator('.reroute-dialog button', { hasText: 'Close' }).click();

// What always needs you: Settings → Project → Risk policy, opened by its deep link.
await openSettings('policy');
await zoom('lookout-risk', ['#settings-policy'], { aspect: 4 / 3, pad: 16 });

// Settings → This trail → Model matching: the tier per ticket type, with hints from Trail stats. Switched on here (it
// starts off so the scripted agents can take every ticket, see lib/realProject.mjs).
// A taller window: the section is the group's last but one, so it can't scroll up to the top of a normal one.
await page.setViewportSize({ ...size, height: 1250 });
await openSettings('models');
await page.locator('.model-matching-toggle').click();
await page.locator('.tier-grid .tier-row').first().waitFor({ timeout: 10000 });
await wait(900);
await zoom('lookout-model-matching', ['#settings-models'], { aspect: 16 / 10, pad: 16 });
await page.setViewportSize(size);

// Settings → Project → Guides: Browse guides for more, then Write your own, with a team's own guide waiting for
// your approval. A taller window holds the whole section.
await page.setViewportSize({ ...size, height: 1300 });
await openSettings('guides');
await zoom('lookout-guides', ['#settings-guides .guides-foot', '#settings-guides .sp-where'], {
  aspect: null,
  pad: 16,
  top: 6,
});
// Browse guides: the public catalog, live.
await page.setViewportSize(size);
await page.getByRole('button', { name: 'Browse guides' }).click();
await page.locator('.catalog-dialog .catalog-list li').nth(2).waitFor({ timeout: 20000 });
await wait(800);
await zoom('lookout-guide-catalog', ['.catalog-dialog'], { aspect: 16 / 10, pad: 24 });
await page.locator('.catalog-dialog').getByRole('button', { name: 'Close' }).click();
await wait(400);
await closeSettings();

// Parallel work: the overlap warning in the queue, then the ticket with the files its agent expects to change.
// A tall window, so the warning and the items around it show whole, without scrolling the list.
await page.setViewportSize({ ...size, height: 1500 });
const overlap = page.locator('.att-item.k-overlap').first();
await overlap.waitFor({ timeout: 20000 });
await overlap.evaluate((el) => el.scrollIntoView({ block: 'center' }));
await wait(800);
// The warning between its neighbours in Waiting on you.
await page.evaluate(() => {
  const items = [...document.querySelectorAll('.att-item')];
  const i = items.findIndex((el) => el.classList.contains('k-overlap'));
  items[i - 1]?.setAttribute('data-shot', 'before');
  items[i + 1]?.setAttribute('data-shot', 'after');
});
await zoom('lookout-overlap', ['[data-shot="before"]', '.att-item.k-overlap', '[data-shot="after"]'], {
  aspect: null,
  pad: 0,
});
await page.setViewportSize(size);
await wait(600);
await page.locator('.node', { hasText: 'Show sync status' }).first().dispatchEvent('click');
await page.locator('.inspector', { hasText: 'Expects to change' }).waitFor({ timeout: 15000 });
await wait(600);
await zoom('lookout-parallel-ticket', ['.inspector'], { aspect: 4 / 5, pad: 0 });

// Settings → Project → Workspaces: a worktree and branch for each claimed ticket (on in lib/realProject.mjs).
await page.setViewportSize({ ...size, height: 1100 });
await openSettings('workspaces', 'center');
await page.locator('.worktrees-toggle[aria-pressed="true"]').waitFor();
await page.locator('.ws-row').nth(1).waitFor({ timeout: 10000 });
await wait(900);
await zoom('lookout-workspaces', ['#settings-workspaces'], { aspect: null, pad: 16 });
await page.setViewportSize(size);
await closeSettings();

// All projects: this repo and billing-service (lib/realProject.mjs), with one Needs you list across them.
// 1440 wide is the smallest window that shows the list and the projects side by side.
await page.setViewportSize({ width: 1440, height: 760 });
await page.locator('.project-btn').click();
await page.locator('.trail-item.all-projects').click();
await page.locator('.projects-view .pj-item').first().waitFor({ timeout: 15000 });
await wait(1500);
await zoom('lookout-all-projects', ['.projects-view'], { aspect: null, pad: 0 });
await page.keyboard.press('Escape');
await page.setViewportSize(size);
// No hover tip or focus ring left over for the phone shot.
await clearUi();

// Phone view of the same project.
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
await wait(2500);
// Top half only: the header and the Waiting on you inbox.
const { data } = await cdp.send('Page.captureScreenshot', {
  format: 'png',
  clip: { x: 0, y: 0, width: 390, height: 430, scale: 1 },
});
writeFileSync(join(media, 'lookout-phone.png'), Buffer.from(data, 'base64'));
console.log('saved lookout-phone.png');
await ctx.close();
await browser.close();
process.exit(0);
