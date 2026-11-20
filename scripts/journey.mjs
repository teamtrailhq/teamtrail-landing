// Renders the hero video public/media/landing-journey-720.mp4 (and its poster): "a day with Teamtrail".
// The Lookout is the real app, driven live; terminal and Claude Code scenes, chapter labels and
// captions are an overlay in the same page (journey/stage.mjs). Frames come from a CDP screencast and
// are encoded with ffmpeg (needed on PATH).
// It runs on a real project (lib/realProject.mjs): the dev seed, the built `teamtrail` server and real MCP agents.
// Run: npm run build -w teamtrail in ../teamtrail (once), then `npm run journey` here.
// Env: CHROME_PATH (default /usr/local/bin/google-chrome).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { AGAIN, CHECK_IN, FRAME, RESUME, SETUP, START } from './journey/scenes.mjs';
import { installStage } from './journey/stage.mjs';
import { GUARDED, TRAIL, setUpVerifiedTrail } from './journey/verifiedTrail.mjs';
import { realProject } from './lib/realProject.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// THEME=night captures into public/media/night/; the site swaps them in with the theme (src/theme.ts).
const night = process.env.THEME === 'night';
const media = join(root, night ? 'public/media/night' : 'public/media');
mkdirSync(media, { recursive: true });
const colorScheme = night ? 'dark' : 'light';
const framesDir = join(root, 'capture-frames');
const size = { width: 1680, height: 945 };
// Three agents, so the map has work in flight while one of them waits on you.
const project = await realProject({ agents: 3 });
const version = project.started.match(/Teamtrail (\S+) ·/)?.[1] ?? '';
process.on('exit', () => project.stop());
/** Waits until the agents' output shows `text` `times` times. */
const agentStep = async (text, times = 1) => {
  for (let t = 0; t < 240 && project.agentLog().split(text).length - 1 < times; t++) await wait(500);
};
const scout = `data:image/png;base64,${readFileSync(join(root, 'scripts/assets/scout-512.png')).toString('base64')}`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/local/bin/google-chrome' });
// The overlay injects its own <style>, which the Lookout's Content-Security-Policy (style-src 'self') would block.
const page = await (await browser.newContext({ viewport: size, colorScheme, bypassCSP: true })).newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.addInitScript(installStage, { scout, night });
const wait = (ms) => page.waitForTimeout(ms);
const stage = (fn, ...args) => page.evaluate(([f, a]) => window.__stage[f](...a), [fn, args]);
const caption = (label, text) => stage('caption', label, text);
const term = async (title, lines, label, text) => {
  await caption(label, text);
  await stage('term', title, lines);
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
/** Closes whatever dialog opened over the page, with Esc (a bubble behind it can take the first one). */
const closeDialogs = async () => {
  for (let i = 0; i < 4 && (await page.locator('.scrim').count()); i++) {
    await page.keyboard.press('Escape');
    await wait(500);
  }
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
/** A view tab in the header: Map, Plan, Activity or Logbook. */
const view = async (name) => {
  await closeDialogs();
  await page.locator('.view-bar').getByRole('button', { name, exact: true }).click();
};
/** The trail bar's More (the lists under it) or Less. */
const trailBarMore = async (more) => {
  const button = page.locator('.trail-bar').getByRole('button', { name: more ? 'More' : 'Less', exact: true });
  if (await button.count()) await button.click();
  await page.locator('.trail-lists').waitFor({ state: more ? 'visible' : 'detached', timeout: 10000 });
};
/** Switches trails from the trail menu under the title. */
const switchTrail = async (name) => {
  await closeDialogs();
  await page.locator('.trail-btn').click();
  // No hover tip over the open menu.
  await page.mouse.move(size.width / 2, size.height - 4);
  await wait(1400);
  await page.getByRole('menuitem').filter({ hasText: name }).first().click();
};
/** Opens the Settings page at a section by its deep link (`?settings=<section>`), as the app's own links do. */
const openSettings = async (section) => {
  await page.evaluate((s) => {
    const url = new URL(location.href);
    url.searchParams.set('settings', s);
    history.pushState({ settingsPage: true }, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, section);
  await page.locator(`#settings-${section}`).waitFor({ timeout: 10000 });
  await page.locator(`#settings-${section}`).evaluate((el) => el.scrollIntoView({ block: 'start' }));
};
/** An action on the ticket open in its bubble: the bar's button when it's on show, else from its "⋯" menu. */
const ticketAction = async (name) => {
  const bar = page.locator('.bubble .action-bar');
  const button = bar.getByRole('button', { name, exact: true });
  if (await button.isVisible()) return button.click();
  await bar.getByRole('button', { name: 'More ticket actions' }).click();
  await wait(500);
  await bar.getByRole('menuitem', { name, exact: true }).click();
};
/** Hands-off or Hands-on, from the switch in the header. */
const mode = async (name) => {
  await page.locator('.mode-switch').first().getByRole('button', { name, exact: true }).click();
  await page.locator(name === 'Hands-off' ? '.hands-off-home' : '.map-zone').waitFor({ timeout: 15000 });
};
/** A row of Hands-off's Needs you, by its text, opened (one is open at a time). */
const openNeed = async (text) => {
  const row = page.locator('.home-needs .home-need', { hasText: text }).first();
  if (!(await row.count())) {
    const more = page.locator('.home-needs .home-more', { hasText: 'more' });
    if (await more.count()) await more.click();
  }
  await row.waitFor({ timeout: 30000 });
  if (!(await row.evaluate((el) => el.classList.contains('open')))) await row.locator('.ds-row-main').click();
  await page.locator('.home-needs .home-need.open', { hasText: text }).waitFor({ timeout: 10000 });
  return page.locator('.home-needs .home-need.open');
};
/** Scrolls Hands-off's home so `sel` sits near the top, smoothly, as a person would. */
const homeTo = (sel) =>
  page
    .locator(sel)
    .first()
    .evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
const setVisible = (v) =>
  page.evaluate((v) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'visible' : 'hidden') });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => !v });
    document.dispatchEvent(new Event('visibilitychange'));
  }, v);

// The app defaults to night, so ask for the theme this capture is for.
await page.addInitScript(
  (theme) => {
    const key = 'teamtrail.prefs';
    const prefs = JSON.parse(localStorage.getItem(key) || '{}');
    localStorage.setItem(key, JSON.stringify({ ...prefs, theme }));
  },
  night ? 'night' : 'day',
);
// Pre-roll (not recorded): onboard on the seeded project, then the tab is "away" while the agents work.
// A briefing needs time away: a short away threshold, applied once.
await page.addInitScript(() => {
  if (sessionStorage.getItem('journey-init')) return;
  sessionStorage.setItem('journey-init', '1');
  const key = 'teamtrail.prefs';
  const prefs = JSON.parse(localStorage.getItem(key) || '{}');
  localStorage.setItem(key, JSON.stringify({ ...prefs, briefing: { enabled: true, awayMinutes: 0.05 } }));
});
await project.signIn(page);
// The verification beats' trail, worked by a scripted agent before anything is recorded: one pass held by the check
// guard, waiting for the trail lead (journey/verifiedTrail.mjs).
const verified = await setUpVerifiedTrail({ project, page });
await page.goto(project.url);
await page.locator('.dialog.onboarding').waitFor({ timeout: 20000 });
await page.getByRole('button', { name: 'Get started' }).click();
// Hands-off is everyone's default: the story opens on its home, on the seed's trail mid-flight.
await page.locator('.hands-off-home').waitFor({ timeout: 15000 });
await switchTrail('Offline-first');
await page.locator('.hands-off-home').waitFor({ timeout: 15000 });
// Room under the home's last section, so "Since you were away" can scroll up clear of the captions.
await page.addStyleTag({ content: '.hands-off-home .home-column { padding-bottom: 320px; }' });
await setVisible(false);
// No title card: the video opens on the first scene, so it reads as a video from the first frame.
await caption('Setup once', 'One command connects Claude Code or Codex. Another starts the Lookout.');
await stage('term', 'fieldnote-app — zsh', []);

rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });
// Pausing the recording takes the paused time out of the video: frames after it are dated back by it.
let pausedFor = 0;
let pausedAt = 0;
const cdp = await page.context().newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const file = join(framesDir, `f${String(frames.length).padStart(5, '0')}.jpg`);
  writeFileSync(file, Buffer.from(data, 'base64'));
  frames.push({ file, ts: metadata.timestamp - pausedFor });
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
const screencast = { format: 'jpeg', quality: 90, maxWidth: size.width, maxHeight: size.height };
await cdp.send('Page.startScreencast', screencast);
const pause = async () => {
  await cdp.send('Page.stopScreencast');
  pausedAt = Date.now() / 1000;
};
const resume = async () => {
  pausedFor += Date.now() / 1000 - pausedAt;
  await cdp.send('Page.startScreencast', screencast);
};

await term(
  'fieldnote-app — zsh',
  SETUP({ version }),
  'Setup once',
  'One command connects Claude Code or Codex. Another starts the Lookout.',
);
await term(
  'fieldnote-app — zsh',
  START({ started: project.started }),
  'Setup once',
  'One command connects Claude Code or Codex. Another starts the Lookout.',
);
await term(
  'fieldnote-app — claude',
  FRAME,
  'New project · frame the trail',
  'Type your idea in Claude Code. Scout asks a few questions to frame the trail.',
);

// Hands-off, the home everyone starts on: only what needs you, most urgent first, while agents keep going. The
// recording pauses while the side question is answered off camera, so the open row is the call that blocks the
// trail, and for the poster, which is this frame without the caption over it.
await pause();
await stage('hide');
// The away threshold is seconds long here: keep the trail lead "present" while the tab is visible. Hiding the
// tab still counts as away, which is what "Since you were away" counts from later.
await page.evaluate(() => setInterval(() => window.dispatchEvent(new Event('pointermove')), 1500));
await setVisible(true);
await agentStep('asking:');
await page
  .locator('.home-needs .home-need', { hasText: 'Is silent auto-merge acceptable' })
  .waitFor({ timeout: 60000 });
// The junction's agent asked a side question first (fyi): answered off camera.
const side = page.locator('.home-needs .home-need', { hasText: 'While on' });
if (await side.count()) {
  const row = await openNeed('While on');
  await row.locator('.suggest .chip', { hasText: 'Yes, show names' }).click();
  await side.waitFor({ state: 'detached', timeout: 20000 });
}
await openNeed('Is silent auto-merge acceptable');
await homeTo('.home-needs');
await wait(1500);
await caption('Hands-off · what needs you', 'Only what needs you, most urgent first. Agents keep going.');
await page.mouse.move(size.width - 2, size.height - 2);
await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
await wait(800);
await page.screenshot({ path: join(framesDir, 'poster.png'), style: '#stage-cap { visibility: hidden !important; }' });
await resume();
await wait(4200);

// An agent asks: answer it right in the list.
await caption(
  'Hands-off · answer in place',
  'Answer the agent’s question in the list. It logs the decision and moves on.',
);
await wait(2600);
await page.locator('.home-need.open .suggest .chip').first().click();
await agentStep('answered:');
await wait(1600);

// Research on another trail is done: its plan waits as one row, the brief and every ticket's criteria on the page.
await caption(
  'Hands-off · approve the plan',
  'Research is done: approve the brief and every ticket’s criteria in one step.',
);
const plan = await openNeed('Approve the plan');
await plan.locator('.plan-approval').waitFor({ timeout: 15000 });
await homeTo('.home-need.open');
await wait(2200);
await plan
  .locator('.plan-approval-ticket')
  .first()
  .evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
await wait(2400);
await plan.getByRole('button', { name: 'Approve the plan', exact: true }).click();
await page.locator('.home-need', { hasText: 'Approve the plan' }).waitFor({ state: 'detached', timeout: 15000 });
await wait(1200);

// Under it, how far the trail is and who's at work.
await caption('Hands-off · progress', 'How far the trail is, and every agent at work. Nothing to herd.');
await homeTo('.home-progress');
await wait(3200);

await term(
  'fieldnote-app — zsh',
  AGAIN({ started: project.started }),
  'Existing project · same command',
  'Come back later and run the same command.',
);
await stage('hide');
// The tab stays present through the terminal scene, so the home still counts from the visit before the morning's
// work: what the agents decided and finished while you were away.
await agentStep('closed #6');
await wait(1500);
await caption('Since you were away', 'Back after a break? What agents decided, what changed and what was verified.');
await homeTo('.home-since');
await wait(3800);

// The map, when you want it: Hands-on, one click.
await caption('Hands-on · the whole map', 'Want the map? Hands-on is one click away.');
await homeTo('.home-needs');
await wait(900);
await mode('Hands-on');
await page.locator('.map-zone .node').first().waitFor({ timeout: 15000 });
// The trip report is Hands-on's: closed, and kept closed for the rest of the run.
await page
  .getByRole('dialog', { name: 'While you were away' })
  .getByRole('button', { name: 'Dismiss' })
  .click({ timeout: 2500 })
  .catch(() => {});
await page.evaluate(() => {
  const prefs = JSON.parse(localStorage.getItem('teamtrail.prefs') || '{}');
  localStorage.setItem('teamtrail.prefs', JSON.stringify({ ...prefs, briefing: { enabled: false, awayMinutes: 15 } }));
});
await closeDialogs();
await closeBubble();
await wait(2600);
await view('Logbook');
await page.locator('.dv-row button').first().click();
await caption('Every call, kept', 'Every answer is logged in the Logbook, with its reasoning.');
await wait(2800);
await view('Map');

// A finding broke an assumption: the agent proposes a new plan, previewed on the map, and you approve it.
await caption('When the facts change', 'An agent proposes a new plan. See it on the map before anything moves.');
await page.locator('.reroute-banner').waitFor({ timeout: 15000 });
await closeBubble();
await wait(2600);
await page.locator('.reroute-banner').getByRole('button', { name: 'Review' }).click();
await page.locator('.reroute-dialog').waitFor();
await caption('When the facts change', 'Why, the evidence and every change. Nothing happens until you approve.');
await wait(3600);
await page.locator('.reroute-dialog button', { hasText: 'Close' }).click();

await term(
  'fieldnote-app — claude',
  RESUME,
  'Existing project · resume',
  'Resume, and work picks up where it left off.',
);
await term('fieldnote-app — claude', CHECK_IN, 'From Claude Code', 'Or check in with /scout status and /scout inbox.');
await stage('hide');
// Every repo: All projects, with this repo and billing-service (lib/realProject.mjs) in one Needs you list.
await caption('Every repo', 'More than one repo? One list of what needs you across all of them.');
await closeDialogs();
await page.locator('.project-btn').click();
await wait(900);
await page.locator('.trail-item.all-projects').click();
await page.locator('.projects-view .pj-item').first().waitFor({ timeout: 10000 });
await wait(2400);
await page.keyboard.press('Escape');
await page.locator('.projects-view').waitFor({ state: 'detached', timeout: 10000 });
await wait(800);

// Verified, not claimed: the checks passed, but the work changed what they run (package.json's `test` script), so the
// check guard holds the pass for you. Accept it with a reason, or send it back.
await caption('Verified, not claimed', 'Checks passed, but the work changed what they run. The pass waits for you.');
await switchTrail(TRAIL);
await page.locator('.map-zone .node', { hasText: GUARDED }).first().waitFor({ timeout: 15000 });
await wait(600);
await openTicket(GUARDED);
await page.locator('.bubble .bubble-need', { hasText: 'changed what they run' }).waitFor({ timeout: 15000 });
await wait(3000);
await ticketAction('Accept the pass…');
const why = page.locator('.inline-form', { hasText: 'Why accept' });
await why.waitFor({ timeout: 10000 });
await caption('Verified, not claimed', 'Accept the pass with a reason, or send it to rework. The proof says which.');
await why.getByLabel('Why accept').pressSequentially('Same suite; the old script never ran on Windows', { delay: 22 });
await wait(500);
await why.getByRole('button', { name: 'Accept anyway' }).click();
await wait(400);

// Gates: off, observe or enforce, each with what it held lately. The accepted ticket finishes the trail, and its done
// dialog (the work isn't on main yet) closes off camera first.
await pause();
await page.locator('.bubble .bubble-state', { hasText: 'Done' }).waitFor({ timeout: 20000 });
await page
  .locator('.dialog.trail-done')
  .waitFor({ timeout: 15000 })
  .catch(() => {});
await closeDialogs();
await closeBubble();
await openSettings('gates');
await page.locator('.gate-row', { hasText: 'Held 1 ticket' }).first().waitFor({ timeout: 15000 });
await page.mouse.move(size.width - 2, size.height - 2);
await caption('Gates you choose', 'Each gate is off, observe or enforce, and shows what it held lately.');
await wait(600);
await resume();
await wait(3800);

// Merged: Teamtrail runs the approved checks on main by itself, and the whole trail is verified together. The merge
// and the run happen off camera.
await pause();
await caption('', '');
await page.locator('.settings-page .back').click();
await page.locator('.settings-page').waitFor({ state: 'detached', timeout: 10000 });
const head = verified.merge();
const together = page.locator('.dialog.trail-done', { hasText: `verified together on main at ${head}` });
await together.waitFor({ timeout: 120000 });
await caption('Verified together', 'Merged, the checks run again on main: the whole trail, verified together.');
await wait(600);
await resume();
await wait(3000);
await together.getByRole('button', { name: 'Close' }).click();
await together.waitFor({ state: 'detached' });
await page.locator('g.destination').click();
await page
  .locator('.bubble .trail-checks', { hasText: `Verified together on main at ${head}` })
  .waitFor({ timeout: 15000 });
await page.mouse.move(size.width / 2, size.height - 4);
await wait(3600);
await caption('', '');
await stage('card', 'end');
await wait(3200);

await cdp.send('Page.stopScreencast');
const end = Date.now() / 1000 - pausedFor;
await browser.close();

// Frames arrive on repaint; per-frame durations from their timestamps keep holds at real length.
const list = frames
  .map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, (frames[i + 1]?.ts ?? end) - f.ts).toFixed(4)}`)
  .join('\n');
writeFileSync(join(framesDir, 'list.txt'), `${list}\nfile '${frames.at(-1).file}'\n`);
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);
ff([
  ...['-f', 'concat', '-safe', '0', '-i', join(framesDir, 'list.txt')],
  ...['-vf', 'scale=1280:720:flags=lanczos,fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '22'],
  ...['-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', join(media, 'landing-journey-720.mp4')],
]);
ff([
  '-i',
  join(framesDir, 'poster.png'),
  '-vf',
  'scale=1280:720:flags=lanczos',
  join(media, 'landing-journey-poster.png'),
]);
rmSync(framesDir, { recursive: true, force: true });
console.log(`saved landing-journey-720.mp4 (${frames.length} frames) and landing-journey-poster.png`);
process.exit(0);
