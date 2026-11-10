// Loads every kind of page in a real Chrome, in both themes, and fails on any Content-Security-Policy
// violation, console error, page error or failed request. It also uses what the policy could break: the theme
// switch, the hero canvas, the video, copy buttons, the docs "open in" links, the star count and the waitlist.
//   npm run build && npm run preview -- --port 4319   # sends vercel.json's headers
//   BASE=http://localhost:4319 npm run verify:csp     # or BASE=<a Vercel preview URL>
// The waitlist is submitted with the honeypot filled, so a real deployment answers ok and adds nobody.
import { chromium } from 'playwright-core';

const BASE = (process.env.BASE ?? 'http://localhost:4319').replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HEADERS = ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy'];
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(BASE);
// `vite preview` answers unknown paths with Home, so the not-found page is opened by name there.
const NOT_FOUND = LOCAL ? '/404.html' : '/no-such-page';
const PAGES = ['/', '/features/', '/guides/', '/cloud/', '/docs/', '/docs/install/', NOT_FOUND];

const problems = [];
const note = (where, what) => problems.push(`${where}: ${what}`);

/** Watches one page for everything a too-strict policy shows up as. */
async function watch(page, where) {
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__csp.push(
        `${e.effectiveDirective} blocked ${e.blockedURI || 'inline'} (${e.sourceFile ?? ''}:${e.lineNumber})`,
      );
    });
  });
  page.on('console', (m) => {
    if (m.type() === 'error' || /Content Security Policy|Permissions-Policy|Unrecognized feature/i.test(m.text())) {
      // Expected: the not-found page's own 404 and, off Vercel, the analytics script only Vercel serves.
      const about = `${m.text()} ${m.location().url}`;
      if (/status of 404/.test(about) && about.includes(NOT_FOUND)) return;
      if (LOCAL && about.includes('/_vercel/insights/')) return;
      note(where, `console ${m.type()}: ${m.text().slice(0, 300)}`);
    }
  });
  page.on('pageerror', (e) => note(where, `page error: ${e.message}`));
  page.on('requestfailed', (r) => {
    const reason = r.failure()?.errorText ?? '';
    if (reason !== 'net::ERR_ABORTED') note(where, `request failed: ${r.url()} ${reason}`);
  });
}

async function checkHeaders(response, where) {
  const sent = response.headers();
  for (const name of [...HEADERS, 'permissions-policy']) if (!sent[name]) note(where, `no ${name} header`);
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
}

async function checkHome(page, where) {
  const painted = await page.evaluate(() => {
    const canvas = document.querySelector('canvas[data-field="hero"]');
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    return data.some((v) => v !== 0);
  });
  if (!painted) note(where, 'the hero canvas is blank');
  const video = page.locator('video').first();
  await video.scrollIntoViewIfNeeded();
  await page
    .waitForFunction(() => document.querySelector('video').currentTime > 0, null, { timeout: 10_000 })
    .catch(() => {
      note(where, 'the video did not play');
    });
  const stars = await page.waitForSelector('[data-gh-stars]:not([hidden])', { timeout: 8000 }).catch(() => null);
  if (!stars) note(where, 'the GitHub star count did not show (blocked, or GitHub rate-limited this IP)');
  await page.locator('[data-copy]').first().click();
  await page.waitForSelector('.toast.is-on');
}

async function checkDocs(page, where) {
  await page.locator('.code__copy').first().click();
  await page.locator('.docs-copy__main').click();
  for (const llm of ['chatgpt', 'claude']) {
    const href = await page.locator(`[data-llm="${llm}"]`).first().getAttribute('href');
    if (!/^https:\/\/(chatgpt\.com|claude\.ai)\//.test(href ?? '')) note(where, `the ${llm} link is ${href}`);
  }
}

async function checkGuides(page) {
  await page.locator('[data-guide-dialog]').first().click();
  await page.waitForSelector('dialog.gdlg[open]');
  await page.locator('dialog.gdlg[open] [data-guide-close]').click();
}

async function checkWaitlist(page, where) {
  // Off Vercel there is no function: answer for it, so the request still has to pass connect-src.
  if (LOCAL) await page.route('**/api/waitlist', (route) => route.fulfill({ json: { ok: true } }));
  await page.fill('[data-waitlist] input[name="email"]', 'csp-check@example.com');
  await page.evaluate(() => (document.querySelector('[data-waitlist] input[name="company"]').value = 'csp-check'));
  await page.click('[data-waitlist] button[type="submit"]');
  await page.waitForSelector('[data-waitlist].is-done', { timeout: 10_000 }).catch(async () => {
    note(where, `the waitlist said: ${await page.textContent('[data-waitlist-status]')}`);
  });
}

const CHECKS = { '/': checkHome, '/guides/': checkGuides, '/docs/install/': checkDocs, '/cloud/': checkWaitlist };

async function visit(context, path, theme) {
  const where = `${path} (${theme})`;
  const page = await context.newPage();
  await watch(page, where);
  const response = await page.goto(BASE + path, { waitUntil: 'load' });
  await checkHeaders(response, where);
  const look = await page.evaluate(() => document.documentElement.dataset.theme);
  if (look !== theme) note(where, `the theme boot script did not run: data-theme is ${look}`);
  await scrollThrough(page);
  await CHECKS[path]?.(page, where);
  await page.locator('[data-theme-switch]:visible').first().click();
  await page.waitForTimeout(400);
  for (const violation of await page.evaluate(() => window.__csp)) note(where, `CSP: ${violation}`);
  await page.close();
}

const browser = await chromium.launch({ executablePath: CHROME });
for (const theme of ['night', 'day']) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ['clipboard-write'],
  });
  await context.addInitScript((look) => localStorage.setItem('teamtrail-theme', look), theme);
  for (const path of PAGES) await visit(context, path, theme);
  await context.close();
}
await browser.close();

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`ok: ${PAGES.length} pages x 2 themes at ${BASE}, no CSP violations, console errors or failed requests`);
