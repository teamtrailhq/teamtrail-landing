// Records the demo video of the Polish deck (teamtrail-cloud docs/decks/general): a trail on a small shop's
// checkout, from `npx teamtrail` to every ticket verified. The Lookout is the real app, driven live; the agents are
// real MCP clients (deck/agents.mjs) whose code changes run through the repo's real tests (deck/acmeShop.mjs). The
// terminal and Claude Code scenes, chapter labels and captions are the journey's overlay (journey/stage.mjs).
// Run: npm run build -w teamtrail in ../teamtrail (once), then `node scripts/deck-demo.mjs`.
// Env: CHROME_PATH (default /usr/local/bin/google-chrome), CAPTURE_CODE_DIR (default /Users/Shared/code),
//      DECK_DEMO_OUT (default deck-demo/): demo.mp4 (1920×1080) and poster.png. Needs ffmpeg on PATH.
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { CHANGES, makeAcmeShop, writeFiles } from './deck/acmeShop.mjs';
import { connectAgent } from './deck/agents.mjs';
import { ANSWER, CAPTIONS, CONNECT, END, NEW_TRAIL, STATUS } from './deck/scenes.mjs';
import { installStage } from './journey/stage.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = process.env.TEAMTRAIL_REPO ?? path.resolve(root, '../teamtrail');
const cli = path.join(repo, 'packages/cli/dist/cli.js');
if (!fs.existsSync(cli)) throw new Error('build the CLI first: npm run build -w teamtrail');
const version = JSON.parse(fs.readFileSync(path.join(repo, 'packages/cli/package.json'), 'utf8')).version;
const out = path.resolve(process.env.DECK_DEMO_OUT ?? path.join(root, 'deck-demo'));
const framesDir = path.join(out, 'frames');
const dir = path.join(process.env.CAPTURE_CODE_DIR ?? '/Users/Shared/code', 'acme-shop');
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'teamtrail-deck-'));
const env = {
  ...process.env,
  TEAMTRAIL_CONFIG_DIR: path.join(home, 'config'),
  TEAMTRAIL_NO_REGISTER: '1',
  TEAMTRAIL_NO_GH_CLI: '1',
};
for (const k of ['GITHUB_TOKEN', 'GH_TOKEN', 'LINEAR_API_KEY']) delete env[k];

// The project and its Lookout, as a user starts it in the repo.
makeAcmeShop(dir);
const server = spawn(process.execPath, [cli, '--no-open', '--port', '0'], { cwd: dir, env });
let serverOut = '';
const started = await new Promise((resolve, reject) => {
  server.stdout.on('data', (c) => {
    serverOut += c;
    const url = serverOut.match(/Lookout\s+(http:\S+)/)?.[1];
    const link = serverOut.match(/Sign in\s+(http:\S+#pair=\S+)/)?.[1];
    if (url && link && /Press Ctrl\+C/.test(serverOut)) resolve({ url, link });
  });
  server.on('exit', (code) => reject(new Error(`teamtrail exited ${code}: ${serverOut}`)));
});
const agents = [];
const stop = () => {
  for (const a of agents) a.close();
  server.kill();
  fs.rmSync(home, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });
};
process.on('exit', stop);
const pairLink = () =>
  execFileSync(process.execPath, [cli, 'pair', '--no-open'], { cwd: dir, env, encoding: 'utf8' }).match(
    /http:\S+#pair=\S+/,
  )[0];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/usr/local/bin/google-chrome' });
const size = { width: 1600, height: 900 };
const dayPrefs = (theme) => {
  const prefs = JSON.parse(localStorage.getItem('teamtrail.prefs') || '{}');
  localStorage.setItem('teamtrail.prefs', JSON.stringify({ ...prefs, theme }));
};

// Pre-roll, not recorded: the repo's check command is approved on this machine, as on a first run.
{
  const ctx = await browser.newContext({ viewport: size });
  const setup = await ctx.newPage();
  await setup.addInitScript(dayPrefs, 'day');
  await signIn(setup, started.link);
  await setup.locator('.dialog.onboarding').waitFor({ timeout: 20000 });
  await setup.getByRole('button', { name: 'Get started' }).click();
  await setup.goto(`${started.url}?settings=approvals`);
  const row = setup.locator('.ap-row', { hasText: 'Check commands in verification.json' });
  await row.getByRole('button', { name: 'Approve' }).click({ timeout: 20000 });
  await setup.getByText('Nothing waiting').waitFor({ timeout: 15000 });
  await ctx.close();
}

async function signIn(page, link) {
  await page.goto(link);
  const reloaded = page.waitForEvent('load', { timeout: 15000 });
  await page.getByRole('button', { name: 'Sign in this browser' }).click();
  await page.waitForFunction(() => !!localStorage.getItem('teamtrail.session'));
  await reloaded;
}

// The recording: a fresh browser, as the person watching has.
const scout = `data:image/png;base64,${fs.readFileSync(path.join(root, 'scripts/assets/scout-512.png')).toString('base64')}`;
const wordmark = fs
  .readFileSync(path.join(root, 'partials/sprite.html'), 'utf8')
  .match(/<symbol id="tt-wordmark"[^>]*>([\s\S]*?)<\/symbol>/)[1];
// The overlay injects its own <style>, which the Lookout's Content-Security-Policy (style-src 'self') would block.
const ctx = await browser.newContext({ viewport: size, deviceScaleFactor: 1.2, bypassCSP: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.addInitScript(dayPrefs, 'day');
await page.addInitScript(installStage, { scout, wordmark, night: false });
const wait = (ms) => page.waitForTimeout(ms);
const stage = (fn, ...args) => page.evaluate(([f, a]) => window.__stage[f](...a), [fn, args]);
const caption = ([label, text]) => stage('caption', label, text);
const term = async (title, lines, prompt) => stage('term', title, lines, prompt);

fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });
const frames = [];
let cdp;
const screencast = { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080 };
const record = async () => {
  cdp = await page.context().newCDPSession(page);
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = path.join(framesDir, `f${String(frames.length).padStart(5, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, ts: metadata.timestamp });
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', screencast);
};

// 1. Start: the pairing page waits under the terminal, where `npx teamtrail` prints its link.
await page.goto(pairLink());
await page.getByRole('button', { name: 'Sign in this browser' }).waitFor({ timeout: 15000 });
await page.evaluate(() => document.fonts.ready);
await record();
await caption(CAPTIONS.start);
const printed = serverOut
  .split('\n')
  .filter((l) => l.trim())
  .map((l) => ({ t: l.replace(/#pair=\S+/, '#pair=••••••••'), cls: /Scout online/.test(l) ? 'ok' : '' }));
await term('acme-shop — zsh', [{ t: 'npx teamtrail', type: true }, { t: '' }, ...printed], '~/acme-shop $ ');
await wait(1800);
await page.screenshot({ path: path.join(framesDir, 'poster.png') });

// 2. One click signs this browser in.
await stage('hide');
await caption(CAPTIONS.signIn);
await wait(1800);
const reloaded = page.waitForEvent('load', { timeout: 15000 });
await page.getByRole('button', { name: 'Sign in this browser' }).click();
await reloaded;
await caption(CAPTIONS.signIn);
await page.locator('.dialog.onboarding').waitFor({ timeout: 20000 });
await wait(2200);
await page.getByRole('button', { name: 'Get started' }).click();
await wait(1500);

// 3. One command connects Claude Code.
await caption(CAPTIONS.connect);
await term('acme-shop — zsh', CONNECT(version), '~/acme-shop $ ');
await wait(1200);

// 4. In Claude Code, the agent charts the trail.
const claude = await connectAgent({ repo, cli, dir, home, env, name: 'claude-01', model: 'claude-opus-4-5' });
agents.push(claude);
const trail = await claude.call(
  'start_trail',
  {
    title: 'Free shipping over $50',
    destination:
      'Orders of $50 or more ship free, and checkout shows how close a cart is to free shipping. Amounts stay in cents.',
    unspecified: ['International orders'],
    tickets: [
      { ref: 'totals', title: 'How are cart totals computed today?', type: 'research' },
      { ref: 'rule', title: 'Does the $50 count before or after discounts?', type: 'junction' },
      {
        ref: 'setting',
        title: 'Add the threshold to store settings',
        type: 'task',
        blockedBy: ['totals'],
        criteria: [
          { text: 'The threshold is a store setting of 5000 cents', kind: 'unit' },
          { text: "The repo's tests pass", kind: 'regression' },
        ],
      },
      {
        ref: 'checkout',
        title: 'Free shipping at checkout',
        type: 'execute',
        blockedBy: ['rule', 'setting'],
        criteria: [
          { text: 'Orders of $50 or more after discounts ship free', kind: 'unit' },
          { text: 'Orders under $50 still pay $5.99 shipping', kind: 'unit' },
          { text: "The repo's tests pass", kind: 'regression' },
        ],
      },
    ],
  },
  { turns: 3 },
);
const keyOf = (title) => trail.tickets.find((t) => t.title.startsWith(title)).key;
const K = {
  discovery: keyOf('Discovery brief'),
  totals: keyOf('How are cart totals'),
  rule: keyOf('Does the $50'),
  setting: keyOf('Add the threshold'),
  checkout: keyOf('Free shipping at checkout'),
};
await caption(CAPTIONS.newTrail);
await term(
  'acme-shop — claude',
  NEW_TRAIL({ title: trail.trail.title, count: trail.tickets.length, key: trail.trail.key }),
  '> ',
);
await wait(1000);

// 5. Live in the Lookout: the map.
await stage('hide');
await page
  .locator('.node')
  .nth(trail.tickets.length - 1)
  .waitFor({ timeout: 15000 });
await caption(CAPTIONS.live);
await page.locator('.fit-btn').click();
await wait(4500);

// 6. Discovery first: the agent maps what exists, in a brief.
await caption(CAPTIONS.discovery);
await claude.call('claim_ticket', { ticket: K.discovery });
await claude.call('report_progress', { step: 'Investigate', message: 'reading src/cart/totals.js' }, { turns: 4 });
await wait(2500);
await claude.call('report_progress', { step: 'Investigate', message: 'reading src/checkout/summary.js' }, { turns: 3 });
await wait(2000);
await claude.call(
  'submit_brief',
  {
    summary: 'Ship free on orders of $50 or more and show the remaining amount at checkout.',
    productContext: 'Every shopper at checkout. Amounts are in cents; the store sells in USD.',
    existing: [
      '- `src/cart/totals.js`: subtotal and afterDiscounts, in cents',
      '- `src/settings/store.js`: store settings, the flat $5.99 shipping',
      '- `src/checkout/summary.js`: the checkout summary lines',
      '- `test/`: node tests, run by `npm test`',
    ].join('\n'),
    risks: 'Discounted carts near $50 could flip between free and paid shipping.',
    assumptions: ['Prices are stored in cents', 'One threshold for every region'],
  },
  { turns: 3 },
);
await page.getByRole('button', { name: 'Review brief' }).waitFor({ timeout: 15000 });
await wait(1500);

// 7. You decide: the brief, then Accept.
await caption(CAPTIONS.brief);
await page.getByRole('button', { name: 'Review brief' }).click();
await page.locator('.brief-dialog').waitFor();
await wait(2500);
await page.locator('.brief-dialog').evaluate((d) => {
  const body = [...d.querySelectorAll('*')].find((e) => e.scrollHeight > e.clientHeight + 40);
  body?.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
});
await wait(2800);
await page.getByRole('button', { name: 'Accept brief' }).click();
await page.locator('.brief-dialog').waitFor({ state: 'detached', timeout: 15000 });
await claude.call('claim_ticket', { ticket: K.discovery }).catch(() => {});
await claude.call('close_ticket', { resolution: 'Brief accepted.', noCodeReason: 'Discovery only; no code change.' });
await wait(1200);

// 8. Acceptance criteria, confirmed by you.
await caption(CAPTIONS.criteria);
for (const key of [K.setting, K.checkout]) {
  await page.locator('.fit-btn').click();
  await wait(500);
  await page.locator('.node', { hasText: key }).first().click();
  await wait(1600);
  await page.locator('.inspector').getByRole('button', { name: 'Confirm criteria' }).click({ timeout: 15000 });
  await wait(1800);
}
await page.keyboard.press('Escape');

// 9. A second agent, on another model; each takes an unblocked ticket.
await caption(CAPTIONS.agents);
const sonnet = await connectAgent({ repo, cli, dir, home, env, name: 'claude-02', model: 'claude-sonnet-4-5' });
agents.push(sonnet);
await sonnet.call('claim_ticket', { ticket: K.totals });
await sonnet.call('report_progress', { step: 'Investigate', message: 'reading src/cart/totals.js' }, { turns: 3 });
await claude.call('claim_ticket', { ticket: K.rule });
await claude
  .call('report_progress', { step: 'Resolve', message: 'how discounts apply' }, { turns: 2 })
  .catch(() => claude.call('report_progress', { step: 'Investigate', message: 'how discounts apply' }));
await page.locator('.fit-btn').click();
await wait(4500);

// 10. The agent asks; the question waits on you.
await caption(CAPTIONS.asks);
const asked = claude.call(
  'ask_human',
  {
    question: 'Should the $50 free-shipping threshold count before or after discounts?',
    suggestions: ['After discounts', 'Before discounts'],
    urgency: 'blocking',
  },
  { turns: 2 },
);
const item = page.locator('.inbox-list li button').first();
await item.waitFor({ timeout: 15000 });
await wait(2500);
await item.click();
await wait(2500);

// 11. Your answer, in your own words.
await caption(CAPTIONS.answer);
await page.locator('.comms-input textarea').pressSequentially(ANSWER, { delay: 38 });
await wait(600);
await page.locator('.comms-input textarea').press('Enter');
await asked;
const decided = await claude.call(
  'close_ticket',
  {
    resolution: 'The $50 threshold counts the total after discounts.',
    rationale: 'Shoppers see the discounted total; free shipping should match what they pay.',
    alternatives: ['Before discounts'],
    postTranscript: true,
  },
  { turns: 2 },
);
await wait(1500);

// 12. The decision, recorded with your words.
await caption(CAPTIONS.decision);
await page.getByRole('button', { name: /Records/ }).click();
await page.getByRole('menuitem', { name: /Logbook/ }).click();
await page
  .getByText(/count before or after discounts/)
  .first()
  .click({ timeout: 15000 });
await wait(4500);
await page.keyboard.press('Escape');
await wait(800);

// 13. An assumption challenged, with evidence.
await caption(CAPTIONS.challenge);
await sonnet.call(
  'challenge_assumption',
  {
    assumption: 'S-2',
    evidence: 'src/settings/regions.js ships to US and Canada, at different shipping rates and currencies.',
  },
  { turns: 3 },
);
await sonnet.call(
  'close_ticket',
  {
    resolution: 'Totals are computed in cents: subtotal, then afterDiscounts. Shipping is a flat store setting.',
    noCodeReason: 'Research only.',
  },
  { turns: 2 },
);
await page
  .locator('.plan-zone select, .plan select')
  .first()
  .selectOption({ label: /Assumptions/ })
  .catch(() => {});
await wait(4500);

// 14. The work, verified by the repo's tests.
await caption(CAPTIONS.verify);
const complete = async (key, files, criteria) => {
  await claude.call('claim_ticket', { ticket: key });
  await claude.call('report_progress', { step: 'Resolve', message: `editing ${Object.keys(files)[0]}` }, { turns: 4 });
  writeFiles(dir, files);
  return claude.call(
    'report_completion',
    {
      ticket: key,
      resolution: `Done: ${Object.keys(files).join(', ')}`,
      criteria: criteria.map((id) => ({ id, evidence: 'check:tests' })),
      waitSeconds: 120,
    },
    { turns: 2 },
  );
};
const first = await complete(K.setting, CHANGES.threshold, ['AC-1', 'AC-2']);
const last = await complete(K.checkout, CHANGES.checkout, ['AC-1', 'AC-2', 'AC-3']);
console.log('verification:', first.status, last.status);
await page.locator('.fit-btn').click();
await wait(500);
await page.locator('.node', { hasText: K.checkout }).first().click();
await wait(5500);

// 15. Done: every ticket closed, every decision recorded.
await caption(CAPTIONS.done);
await page.keyboard.press('Escape');
await page.locator('.fit-btn').click();
await wait(4500);

// 16. The same state from Claude Code.
const status = await claude.call('status');
const t = status.trail;
await caption(CAPTIONS.status);
await term(
  'acme-shop — claude',
  STATUS({
    trail: `${t.key} ${t.title}`,
    progress: t.progress,
    spend: `$${t.spend.costUsd} · ${Math.round((t.spend.inputTokens + t.spend.outputTokens) / 1000)}k tokens`,
    lines: [
      `Decision ${decided.decision.id}: after discounts, by you`,
      'Assumption S-2 challenged: one threshold for every region',
    ],
    closing: 'Every ticket verified. Nothing is waiting on you.',
  }),
  '> ',
);
await wait(1500);
await caption(['', '']);
await stage('card', 'end', END);
await wait(3500);

await cdp.send('Page.stopScreencast');
const end = Date.now() / 1000;
await browser.close();

const list = frames
  .map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, (frames[i + 1]?.ts ?? end) - f.ts).toFixed(4)}`)
  .join('\n');
fs.writeFileSync(path.join(framesDir, 'list.txt'), `${list}\nfile '${frames.at(-1).file}'\n`);
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);
ff([
  ...['-f', 'concat', '-safe', '0', '-i', path.join(framesDir, 'list.txt')],
  ...['-vf', 'scale=1920:1080:flags=lanczos,fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20'],
  ...['-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path.join(out, 'demo.mp4')],
]);
ff(['-i', path.join(framesDir, 'poster.png'), '-vf', 'scale=1920:1080:flags=lanczos', path.join(out, 'poster.png')]);
fs.rmSync(framesDir, { recursive: true, force: true });
console.log(`saved ${path.join(out, 'demo.mp4')} (${frames.length} frames) and poster.png`);
process.exit(0);
