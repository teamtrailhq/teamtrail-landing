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
import { AGAIN, CHECK_IN, FRAME, RESUME, SETUP } from './journey/scenes.mjs';
import { installStage } from './journey/stage.mjs';
import { realProject } from './lib/realProject.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// THEME=night captures into public/media/night/; the site swaps them in with the theme (src/theme.ts).
const night = process.env.THEME === 'night';
const media = join(root, night ? 'public/media/night' : 'public/media');
mkdirSync(media, { recursive: true });
const colorScheme = night ? 'dark' : 'light';
const framesDir = join(root, 'capture-frames');
const size = { width: 1680, height: 945 };
const project = await realProject();
process.on('exit', () => project.stop());
/** Waits until the agents' output shows `text` `times` times. */
const agentStep = async (text, times = 1) => {
  for (let t = 0; t < 240 && project.agentLog().split(text).length - 1 < times; t++) await wait(500);
};
const scout = `data:image/png;base64,${readFileSync(join(root, 'scripts/assets/scout-512.png')).toString('base64')}`;

const logo = `data:image/png;base64,${readFileSync(join(root, 'scripts/assets/logo-512.png')).toString('base64')}`;

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/local/bin/google-chrome' });
const page = await (await browser.newContext({ viewport: size, colorScheme })).newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.addInitScript(installStage, { scout, logo, night });
const wait = (ms) => page.waitForTimeout(ms);
const stage = (fn, ...args) => page.evaluate(([f, a]) => window.__stage[f](...a), [fn, args]);
const caption = (label, text) => stage('caption', label, text);
const term = async (title, lines, label, text) => {
  await caption(label, text);
  await stage('term', title, lines);
};
const chip = () => page.locator('.comms .suggest .chip').first();
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
await page.goto(project.url);
await page.locator('.dialog.onboarding').waitFor({ timeout: 20000 });
await page.getByRole('button', { name: 'Get started' }).click();
await page.locator('.node').first().waitFor({ timeout: 15000 });
await setVisible(false);
// No title card: the video opens on the first scene, so it reads as a video from the first frame.
await caption('Setup once', 'Install once. One command connects Claude Code or Codex.');
await stage('term', 'fieldnote-app — zsh', []);

rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });
const cdp = await page.context().newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const file = join(framesDir, `f${String(frames.length).padStart(5, '0')}.jpg`);
  writeFileSync(file, Buffer.from(data, 'base64'));
  frames.push({ file, ts: metadata.timestamp });
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: size.width, maxHeight: size.height });

await term('fieldnote-app — zsh', SETUP, 'Setup once', 'Install once. One command connects Claude Code or Codex.');
await term(
  'fieldnote-app — claude',
  FRAME,
  'New project · frame the trail',
  'Type your idea in Claude Code. Scout asks a few questions to frame the trail.',
);

// The trail Scout charted, live: agents working, one waiting on you.
await stage('hide');
// The away threshold is seconds long here: keep the trail lead "present" while the tab is visible. Hiding the
// tab still counts as away, which is what opens the briefing later.
await page.evaluate(() => setInterval(() => window.dispatchEvent(new Event('pointermove')), 1500));
await setVisible(true);
await page
  .getByRole('button', { name: 'Dismiss' })
  .click({ timeout: 3000 })
  .catch(() => {});
await agentStep('asking:');
await caption('New project · trail map', 'Scout maps the trail. Agents pick up every ticket that isn’t blocked.');
await wait(5000);
await page.screenshot({ path: join(framesDir, 'poster.png') });

// An agent asks; answer in the inbox.
await caption('During the day · an agent asks', 'Everything that needs you, most important first. Answer in a click.');
await page.locator('.att-item.k-question:not(.u-fyi) > button').first().click({ timeout: 20000 });
await chip().waitFor({ timeout: 20000 });
await wait(2600);
await chip().click();
await caption('Running', 'The agent records the decision and moves on to the next ticket.');
await wait(1200);
// Away now, so the next scene's briefing covers what the agents do meanwhile.
await setVisible(false);

await term(
  'fieldnote-app — zsh',
  AGAIN,
  'Existing project · same command',
  'Come back later and run the same command.',
);
await stage('hide');
await agentStep('asking:', 2);
await wait(1500);
await setVisible(true);
await caption('Existing project · briefing', 'Back after a break? Scout briefs you on what’s done and what needs you.');
await wait(4500);
await page
  .getByRole('button', { name: 'Dismiss' })
  .click({ timeout: 5000 })
  .catch((e) => {
    console.log(project.agentLog());
    throw e;
  });
// Keep the briefing closed for the rest of the run.
await page.evaluate(() => {
  const prefs = JSON.parse(localStorage.getItem('teamtrail.prefs') || '{}');
  localStorage.setItem('teamtrail.prefs', JSON.stringify({ ...prefs, briefing: { enabled: false, awayMinutes: 15 } }));
});
await page.getByRole('button', { name: /^Records/ }).click();
await page.locator('.decisions-btn').click();
await page.locator('.dv-row button').first().click();
await caption('Existing project · decisions', 'Every answer is logged with its reasoning.');
await wait(3400);
await page.getByRole('button', { name: /^Records/ }).click();
await page.locator('.decisions-btn').click();

await page.getByRole('button', { name: /^Records/ }).click();
await page.locator('.stats-btn').click();
await page.locator('.perf-recs li').first().waitFor({ timeout: 10000 });
await caption('Across every trail', 'See how each agent delivers, with plain notes from your own numbers.');
await wait(3600);
await page.keyboard.press('Escape');

// A finding broke an assumption: the agent proposes a new plan, previewed on the map, and you approve it.
await caption('When the facts change', 'An agent proposes a new plan. See it on the map before anything moves.');
await page.locator('.reroute-banner').waitFor({ timeout: 15000 });
await wait(3200);
await page.locator('.reroute-banner button').first().click();
await page.locator('.reroute-dialog').waitFor();
await caption('When the facts change', 'Why, the evidence and every change. Nothing happens until you approve.');
await wait(4500);
await page.locator('.reroute-dialog button', { hasText: 'Close' }).click();

await term(
  'fieldnote-app — claude',
  RESUME,
  'Existing project · resume',
  'Resume, and work picks up where it left off.',
);
await term('fieldnote-app — claude', CHECK_IN, 'From Claude Code', 'Or check in with /scout status and /scout inbox.');
await stage('hide');
await caption('Every trail', 'Running several trails? Switch in one click.');
await wait(700);
await page.keyboard.press('Escape');
await page.locator('.trail-btn').click({ force: true });
// No hover tip over the open menu.
await page.mouse.move(size.width / 2, size.height - 4);
await wait(2600);
await page.keyboard.press('Escape');
// Every repo: All projects, with this repo and billing-service (lib/realProject.mjs) in one Needs you list.
await caption('Every repo', 'More than one repo? One list of what needs you across all of them.');
await page.locator('.project-btn').click();
await wait(900);
await page.locator('.trail-item.all-projects').click();
await page.locator('.projects-view .pj-item').first().waitFor({ timeout: 10000 });
await wait(3000);
await page.keyboard.press('Escape');
await caption('', '');
await stage('card', 'end');
await wait(3200);

await cdp.send('Page.stopScreencast');
const end = Date.now() / 1000;
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
