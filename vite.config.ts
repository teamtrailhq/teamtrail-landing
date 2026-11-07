import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import type * as Waitlist from './api/waitlist';
import { generateDocs } from './scripts/docs/generate.mjs';

/** `<!-- @include nav -->` pastes partials/nav.html, so the pages share one nav, footer and icon sprite. */
function partials(): Plugin {
  return {
    name: 'partials',
    transformIndexHtml: (html) =>
      html
        .replaceAll('%SITE_URL%', SITE_URL)
        .replace(/<!-- @include (\w+) -->/g, (_, name: string) =>
          readFileSync(resolve(__dirname, 'partials', `${name}.html`), 'utf8'),
        ),
  };
}

/**
 * Absolute base for share cards (og:image must be an absolute URL): $SITE_URL, else the production URL Vercel
 * provides at build time, else the production address, https://teamtrail.ai.
 */
const SITE_URL = (
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://teamtrail.ai')
).replace(/\/$/, '');

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
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const { POST } = (await server.ssrLoadModule('/api/waitlist.ts')) as typeof Waitlist;
        const r = await POST(
          new Request('http://localhost/api/waitlist', { method: 'POST', body: Buffer.concat(chunks) }),
        );
        res.statusCode = r.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(await r.text());
      });
    },
  };
}

export default defineConfig({
  plugins: [docs(), partials(), devApi()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        features: resolve(__dirname, 'features/index.html'),
        guides: resolve(__dirname, 'guides/index.html'),
        cloud: resolve(__dirname, 'cloud/index.html'),
      },
    },
  },
});
