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
import { frameMap } from './lib/frameMap.mjs';
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

// The end card is wide, so it takes the teamtrail. wordmark, the same outlines the nav and footer use.
const wordmark = readFileSync(join(root, 'partials/sprite.html'), 'utf8').match(
  /<symbol id="tt-wordmark"[^>]*>([\s\S]*?)<\/symbol>/,
)[1];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/local/bin/google-chrome' });
// The overlay injects its own <style>, which the Lookout's Content-Security-Policy (style-src 'self') would block.
const page = await (await browser.newContext({ viewport: size, colorScheme, bypassCSP: true })).newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.addInitScript(installStage, { scout, wordmark, night });
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
  await page.locator('.view-tabs').getByRole('button', { name, exact: true }).click();
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
await page.goto(project.url);
await page.locator('.dialog.onboarding').waitFor({ timeout: 20000 });
await page.getByRole('button', { name: 'Get started' }).click();
await page.locator('.node').first().waitFor({ timeout: 15000 });
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

// The trail Scout charted, live: agents working, one waiting on you. The recording pauses while the side question is
// answered and "N need you" opens the junction's question in its bubble (the map glides to it), and for the poster,
// which is this frame without the caption over it.
await pause();
await stage('hide');
// The away threshold is seconds long here: keep the trail lead "present" while the tab is visible. Hiding the
// tab still counts as away, which is what opens the briefing later.
await page.evaluate(() => setInterval(() => window.dispatchEvent(new Event('pointermove')), 1500));
await setVisible(true);
// The briefing, if it opened: its own Dismiss, not the plan banner's.
await page
  .getByRole('dialog', { name: 'While you were away' })
  .getByRole('button', { name: 'Dismiss' })
  .click({ timeout: 3000 })
  .catch(() => {});
await agentStep('asking:');
// The junction's agent asked a side question first (fyi): answered off camera, so its bubble shows the call that
// blocks the trail.
await openTicket('silent auto-merge');
if (await bubbleQuestion().filter({ hasText: 'While on' }).count()) {
  await page.locator('.bubble .suggest .chip', { hasText: 'Yes, show names' }).click();
}
await bubbleQuestion().filter({ hasText: 'Is silent auto-merge acceptable' }).waitFor({ timeout: 20000 });
await closeBubble();
await page.locator('.needs-btn').click();
await bubbleQuestion().filter({ hasText: 'Is silent auto-merge acceptable' }).waitFor({ timeout: 20000 });
await wait(2500);
await caption('New project · trail map', 'Scout maps the trail. Agents pick up every ticket that isn’t blocked.');
await page.mouse.move(size.width - 2, size.height - 2);
await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
await wait(800);
await page.screenshot({ path: join(framesDir, 'poster.png'), style: '#stage-cap { visibility: hidden !important; }' });
await resume();
await wait(5000);

// An agent asks: the question waits in a bubble beside its ticket; answer it there.
await caption('During the day · an agent asks', 'What needs you opens beside its ticket. Answer in a click.');
await wait(3000);
await page.locator('.bubble .suggest .chip').first().click();
await caption('Running', 'The agent records the decision and moves on to the next ticket.');
await agentStep('answered:');
await wait(1500);
await closeBubble();
await wait(1500);

// Under the map, the trail bar: the trail at a glance, then More for who's working on which model and what's next.
await caption('The trail bar', 'What’s done, who’s working on which model, and what needs you, under the map.');
await wait(2200);
await trailBarMore(true);
await wait(3800);
await trailBarMore(false);
// Away now, so the next scene's briefing covers what the agents do meanwhile.
await setVisible(false);

await term(
  'fieldnote-app — zsh',
  AGAIN({ started: project.started }),
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
  .getByRole('dialog', { name: 'While you were away' })
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
await closeBubble();
await view('Logbook');
await page.locator('.dv-row button').first().click();
await caption('Existing project · decisions', 'Every answer is logged in the Logbook, with its reasoning.');
await wait(3400);
await view('Map');

// A finding broke an assumption: the agent proposes a new plan, previewed on the map, and you approve it.
await caption('When the facts change', 'An agent proposes a new plan. See it on the map before anything moves.');
await page.locator('.reroute-banner').waitFor({ timeout: 15000 });
await closeBubble();
await wait(3200);
await page.locator('.reroute-banner').getByRole('button', { name: 'Review' }).click();
await page.locator('.reroute-dialog').waitFor();
await caption('When the facts change', 'Why, the evidence and every change. Nothing happens until you approve.');
await wait(4500);
await page.locator('.reroute-dialog button', { hasText: 'Close' }).click();

// Another trail's research is done: its brief waits for you, and nothing gets built until you approve it.
await caption('Approve', 'Research is done. Approve the brief, and building can start.');
await switchTrail('Team workspaces');
const ready = page.locator('.scrim .dialog.brief-ready');
await ready.waitFor({ timeout: 15000 });
await wait(2400);
await ready.getByRole('button', { name: 'Review brief' }).click();
await page.locator('.brief-dialog').waitFor();
await wait(2600);
await page.getByRole('button', { name: 'Accept brief' }).click();
await page.locator('.brief-dialog').waitFor({ state: 'detached', timeout: 15000 });
await wait(2000);

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
await wait(3000);
await page.keyboard.press('Escape');
await page.locator('.projects-view').waitFor({ state: 'detached', timeout: 10000 });
await wait(800);

// The seed's finished trail: every ticket done, the trail bar full, a flag at the destination.
await caption('Destination reached', 'Every ticket done: the trail bar fills and the flag goes up.');
await switchTrail('Search across notes');
const reached = page.locator('.scrim [aria-label="Destination reached"]');
await reached.waitFor({ timeout: 15000 });
await wait(2600);
await reached.getByRole('button', { name: 'Close' }).click();
await reached.waitFor({ state: 'detached' });
await closeBubble();
// The trail's last stretch and the flag: the cards nearest the destination, framed as a person zooms in on them.
const last = await page.evaluate(() => {
  const flag = document.querySelector('.map-zone .destination').getBoundingClientRect();
  return [...document.querySelectorAll('.map-zone .node:not(.main-mark)')]
    .map((n) => ({ key: n.querySelector('.key')?.textContent?.trim(), r: n.getBoundingClientRect() }))
    .sort((a, b) => Math.hypot(a.r.x - flag.x, a.r.y - flag.y) - Math.hypot(b.r.x - flag.x, b.r.y - flag.y))
    .slice(0, 4)
    .map((n) => n.key);
});
await frameMap(page, { keys: last, destination: true }, 0.7);
await page.mouse.move(size.width / 2, size.height - 4);
await wait(4000);
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
