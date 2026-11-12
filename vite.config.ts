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

/** `<!-- @include nav -->` pastes partials/nav.html, so the pages share one nav, footer and icon sprite. */
function partials(): Plugin {
  return {
    name: 'partials',
    transformIndexHtml: (html) =>
      html
        .replaceAll('%SITE_URL%', SITE_URL)
        .replaceAll('%SCOUT_INSTALL_URL%', SCOUT_INSTALL_URL)
        .replace(/<!-- @include (\w+) -->/g, (_, name: string) =>
          readFileSync(resolve(__dirname, 'partials', `${name}.html`), 'utf8'),
        ),
  };
}

/**
 * The canonical address, for canonical links, share cards (og:image must be absolute), JSON-LD, the sitemap and
 * llms.txt: $SITE_URL, else https://www.teamtrail.app. Not Vercel's production URL: that is the bare
 * teamtrail.app, which redirects to www, and a canonical must not point at a redirect.
 */
/**
 * Where every "Add Scout to Slack" button on the site goes (`%SCOUT_INSTALL_URL%` in the pages). For now the Slack
 * docs, since Scout is added from the Lookout. Switch it to the Scout service's direct install address
 * (https://scout.teamtrail.app/...) once the service has one, for the Slack Marketplace.
 */
const SCOUT_INSTALL_URL = '/docs/slack/';

const SITE_URL = (process.env.SITE_URL ?? 'https://www.teamtrail.app').replace(/\/$/, '');

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
        privacy: resolve(__dirname, 'privacy/index.html'),
        notFound: resolve(__dirname, '404.html'),
      },
    },
  },
});
