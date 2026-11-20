// Search and LLM discoverability, at build time. Every page gets a canonical link and Twitter title and
// description (copied from its og: tags, so each page says it once); the home page gets the Organization,
// WebSite, SoftwareApplication and FAQPage (read from its FAQ) JSON-LD; the other top-level pages get a
// BreadcrumbList. The build also writes sitemap.xml (every built page, lastmod from git) and robots.txt.
// Docs pages carry their own TechArticle and BreadcrumbList (scripts/docs/template.mjs).
import { relative } from 'node:path';
import { breadcrumbs, faqPage, homeGraph } from './jsonld.mjs';
import { lastmod } from './lastmod.mjs';

/** Breadcrumb names of the top-level pages; any other page uses its title. */
const CRUMBS = {
  '/features/': 'Features',
  '/guides/': 'Guides',
  '/cloud/': 'Cloud',
  '/slack/': 'Scout in Slack',
  '/privacy/': 'Privacy',
};

const attr = (html, re) => re.exec(html)?.[1];
const ldScript = (data) =>
  `    <script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>\n`;

/** `/features/index.html` → `/features/`; `/404.html` stays as is. */
const urlPath = (file) => file.replace(/(^|\/)index\.html$/, '$1');

const noindex = (html) => /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);

/** Head tags for one built page. */
function headTags({ html, siteUrl, path }) {
  const url = `${siteUrl}${path}`;
  const tags = [];
  if (!/rel="canonical"/.test(html)) tags.push(`    <link rel="canonical" href="${url}" />\n`);
  for (const key of ['title', 'description']) {
    const og = attr(html, new RegExp(`property="og:${key}"\\s+content="([^"]*)"`));
    if (og && !html.includes(`name="twitter:${key}"`))
      tags.push(`    <meta name="twitter:${key}" content="${og}" />\n`);
  }
  if (path === '/') tags.push(ldScript(homeGraph(siteUrl)), ldScript(faqPage(html)));
  else if (!path.startsWith('/docs/')) {
    const name = CRUMBS[path] ?? attr(html, /<title>([^<]*)<\/title>/);
    tags.push(ldScript(breadcrumbs(siteUrl, [{ name, path }])));
  }
  return tags.join('');
}

/** The source files a built page comes from: content/docs/<slug>.md for docs, else the HTML entry. */
function sources(root, entry) {
  const rel = relative(root, entry);
  const doc = /^docs\/(?:(.+)\/)?index\.html$/.exec(rel);
  if (!doc) return [rel];
  return [`content/docs/${doc[1] ?? 'introduction'}.md`];
}

function sitemap(siteUrl, pages) {
  const rows = pages.map(
    (p) => `  <url>\n    <loc>${siteUrl}${p.path}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

function robots(siteUrl) {
  const bots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot'];
  const more = ['PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot'];
  const ai = [...bots, ...more].map((b) => `User-agent: ${b}\nAllow: /\n`).join('\n');
  return `# Everyone is welcome, AI crawlers included. The docs are also at /llms.txt and /llms-full.txt.\nUser-agent: *\nAllow: /\n\n${ai}\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

/** @returns {import('vite').Plugin} */
export function seo({ root, siteUrl }) {
  let inputs = {};
  return {
    name: 'seo',
    configResolved(config) {
      inputs = config.build.rollupOptions.input ?? {};
    },
    transformIndexHtml: {
      order: 'post',
      handler: (html, ctx) => {
        if (noindex(html)) return html;
        return html.replace(/\s*<\/head>/, `\n${headTags({ html, siteUrl, path: urlPath(ctx.path) })}  </head>`);
      },
    },
    generateBundle() {
      const pages = Object.values(inputs)
        .map((entry) => ({ entry, path: urlPath('/' + relative(root, entry)) }))
        .filter((p) => !p.path.endsWith('404.html'))
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((p) => ({ path: p.path, lastmod: lastmod(root, sources(root, p.entry)) }));
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(siteUrl, pages) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots(siteUrl) });
    },
  };
}
