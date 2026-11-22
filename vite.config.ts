import { readFileSync } from 'node:fs';
import type { IncomingMessage } from 'node:http';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import type * as Waitlist from './api/waitlist';
import { generateDocs } from './scripts/docs/generate.mjs';
import { renderGuideCards } from './scripts/guides/cards.mjs';
import { loadCatalog } from './scripts/guides/catalog.mjs';
import { analytics } from './scripts/analytics.mjs';
import { securityHeadersPlugin } from './scripts/security/headers.mjs';
import { seo } from './scripts/seo/seo.mjs';
// By path, not as '@teamtrail/site': Vite bundles the config's relative imports, but leaves a package's to Node, which
// can't run its TypeScript.
import { siteFooter, siteNav, themeBootScript } from './node_modules/@teamtrail/site/src/index';

/**
 * `<!-- @include name -->` pastes partials/<name>.html, so the pages share one sprite, trail and command box. The
 * nav, the footer and the theme's boot script come from teamtrail's packages/site (sitePartial), shared with
 * Teamtrail Cloud's welcome page; the nav marks the page it is on.
 */
function partials(): Plugin {
  return {
    name: 'partials',
    transformIndexHtml: (html, ctx) =>
      cloudSignIn(html, ctx.path)
        .replaceAll('%SITE_URL%', SITE_URL)
        .replaceAll('%SCOUT_INSTALL_URL%', SCOUT_INSTALL_URL),
  };
}

/**
 * The canonical address, for canonical links, share cards (og:image must be absolute), JSON-LD, the sitemap and
 * llms.txt: $SITE_URL, else https://www.teamtrail.app. Not Vercel's production URL: that is the bare
 * teamtrail.app, which redirects to www, and a canonical must not point at a redirect.
 */
/**
 * Where every "Add Scout to Slack" button on the site goes (`%SCOUT_INSTALL_URL%` in the pages): the Scout service's
 * direct install, which sends the browser to Slack's consent screen and, once Scout is in the workspace, to a page
 * saying to connect from Teamtrail (Settings -> Slack). It's also the direct install URL for the Slack Marketplace.
 */
const SCOUT_INSTALL_URL = 'https://scout.teamtrail.app/install-slack';

const SITE_URL = (process.env.SITE_URL ?? 'https://www.teamtrail.app').replace(/\/$/, '');

/**
 * Sign in to Teamtrail Cloud (the nav, /cloud): left out of the pages until Cloud is live. A build with
 * CLOUD_SIGN_IN=1 puts it in the nav and keeps the `<!-- @cloud-sign-in -->…<!-- /@cloud-sign-in -->` blocks, all
 * pointing at $CLOUD_APP_URL (default https://app.teamtrail.app; http://app.localhost:7600 to try it against local Cloud).
 * Turned on at launch by setting CLOUD_SIGN_IN=1 for Production in Vercel.
 */
const CLOUD_SIGN_IN = process.env.CLOUD_SIGN_IN === '1';
const CLOUD_APP_URL = (process.env.CLOUD_APP_URL ?? 'https://app.teamtrail.app').replace(/\/$/, '');
const SIGN_IN_BLOCK = /<!-- @cloud-sign-in -->([\s\S]*?)<!-- \/@cloud-sign-in -->\n?/g;

/** The chrome the site shares with Cloud (packages/site), else a partial of this site's own. */
function sitePartial(name: string, path: string) {
  if (name === 'nav') return siteNav({ path, signIn: CLOUD_SIGN_IN ? { href: `${CLOUD_APP_URL}/` } : undefined });
  if (name === 'footer') return `${siteFooter()}\n<div class="toast" role="status" aria-live="polite"></div>`;
  if (name === 'theme-head') return `<script>${THEME_BOOT}</script>`;
  return readFileSync(resolve(__dirname, 'partials', `${name}.html`), 'utf8');
}

/** The theme before first paint: the cookie Cloud shares (tt_theme), else this site's own choice, else night. */
const THEME_BOOT = themeBootScript({
  names: { day: 'day', night: 'night' },
  storageKey: 'teamtrail-theme',
  fallback: 'night',
});

function cloudSignIn(html: string, path: string) {
  return html
    .replace(/<!-- @include ([\w-]+) -->/g, (_, name: string) => sitePartial(name, path))
    .replace(SIGN_IN_BLOCK, (_, inner: string) => (CLOUD_SIGN_IN ? inner : ''))
    .replaceAll('%CLOUD_APP_URL%', CLOUD_APP_URL);
}

/**
 * The docs: content/docs/*.md and nav.json become docs/<slug>/index.html pages (build inputs), raw Markdown at
 * /docs/<slug>.md, and /llms.txt + /llms-full.txt (scripts/docs/generate.mjs). Generated before every build and
 * dev start; in dev, editing content/docs regenerates and reloads the page.
 */
function docs(): Plugin {
  const root = __dirname;
  return {
    name: 'docs',
    config: () => ({ build: { rollupOptions: { input: generateDocs({ root, siteUrl: SITE_URL }) } } }),
    configureServer(server) {
      const dir = resolve(root, 'content/docs');
      server.watcher.add(dir);
      server.watcher.on('all', (_event, file) => {
        if (!file.startsWith(dir)) return;
        generateDocs({ root, siteUrl: SITE_URL });
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

/**
 * `<!-- @guide-cards -->` on /guides becomes one card per guide in the public catalog, read once per build or dev
 * start (scripts/guides/catalog.mjs), with the committed snapshot as the fallback when offline.
 */
function guideCards(): Plugin {
  let cards: Promise<string> | undefined;
  return {
    name: 'guide-cards',
    transformIndexHtml: {
      order: 'pre',
      handler: async (html) => {
        if (!html.includes('<!-- @guide-cards -->')) return html;
        cards ??= loadCatalog(__dirname).then(renderGuideCards);
        return html.replace('<!-- @guide-cards -->', await cards);
      },
    },
  };
}

/** The dev server's request as the web Request Vercel hands the function: same headers, body streamed. */
function toWebRequest(req: IncomingMessage): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
  }
  const init = { method: 'POST', headers, body: Readable.toWeb(req) as ReadableStream, duplex: 'half' };
  return new Request(`http://${req.headers.host ?? 'localhost'}/api/waitlist`, init);
}

/** Serves api/waitlist.ts in `vite dev` the way Vercel does in production, with env from .env.local. */
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      Object.assign(process.env, loadEnv('development', __dirname, 'RESEND_'));
      server.middlewares.use('/api/waitlist', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        const { POST } = (await server.ssrLoadModule('/api/waitlist.ts')) as typeof Waitlist;
        const r = await POST(toWebRequest(req));
        res.statusCode = r.status;
        r.headers.forEach((value, name) => res.setHeader(name, value));
        res.end(await r.text());
      });
    },
  };
}

export default defineConfig({
  plugins: [
    docs(),
    partials(),
    guideCards(),
    seo({ root: __dirname, siteUrl: SITE_URL }),
    analytics(),
    securityHeadersPlugin({ root: __dirname }),
    devApi(),
  ],
  build: {
    // Small fonts stay files: an inlined data: font would need `font-src data:` in the Content-Security-Policy.
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        features: resolve(__dirname, 'features/index.html'),
        guides: resolve(__dirname, 'guides/index.html'),
        cloud: resolve(__dirname, 'cloud/index.html'),
        slack: resolve(__dirname, 'slack/index.html'),
        mobile: resolve(__dirname, 'mobile/index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        notFound: resolve(__dirname, '404.html'),
      },
    },
  },
});
