// The HTML shell of a docs page: the site's head, nav, footer and sprite (Vite partials), a sidebar from
// content/docs/nav.json, the rendered page, the Copy page menu and Previous / Next links.
const escape = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export const pageUrl = (slug) => (slug === 'introduction' ? '/docs/' : `/docs/${slug}/`);
export const mdUrl = (slug) => `/docs/${slug}.md`;

function head({ title, description, url }) {
  const font = (href) => `    <link rel="preload" href="${href}" as="font" type="font/woff2" crossorigin />`;
  return `<!doctype html>
<html lang="en">
  <head>
    <script>try{document.documentElement.dataset.theme=localStorage.getItem('teamtrail-theme')||'night'}catch(e){document.documentElement.dataset.theme='night'}</script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escape(title)} · Teamtrail docs</title>
    <meta name="description" content="${escape(description)}" />
    <link rel="canonical" href="%SITE_URL%${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Teamtrail" />
    <meta property="og:title" content="${escape(title)} · Teamtrail docs" />
    <meta property="og:description" content="${escape(description)}" />
    <meta property="og:url" content="%SITE_URL%${url}" />
    <meta property="og:image" content="%SITE_URL%/media/brand/og-image-1200x630.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Scout, the Teamtrail trail lead, next to the Teamtrail wordmark." />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="%SITE_URL%/media/brand/og-image-1200x630.png" />
    <meta name="theme-color" content="#101815" />
    <link rel="icon" href="/media/brand/favicon-32.png?v=4" type="image/png" sizes="32x32" />
    <link rel="icon" href="/media/brand/favicon-64.png?v=4" type="image/png" sizes="64x64" />
    <link rel="alternate" type="text/markdown" href="${mdUrlFromPage(url)}" />
${font('/node_modules/@fontsource/londrina-solid/files/londrina-solid-latin-900-normal.woff2')}
${font('/node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2')}
${font('/node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2')}
    <link rel="stylesheet" href="/src/styles.css" />
    <link rel="stylesheet" href="/src/docs.css" />
  </head>`;
}

function mdUrlFromPage(url) {
  const slug = url === '/docs/' ? 'introduction' : url.replace(/^\/docs\/|\/$/g, '');
  return mdUrl(slug);
}

function sidebar(nav, current) {
  return nav.sections
    .map(
      (s) => `        <div class="docs-nav__section">
          <p class="docs-nav__title">${escape(s.title)}</p>
          <ul>
${s.pages
  .map((p) => {
    const cur = p.slug === current ? ' aria-current="page"' : '';
    return `            <li><a href="${pageUrl(p.slug)}"${cur}>${escape(p.title)}</a></li>`;
  })
  .join('\n')}
          </ul>
        </div>`,
    )
    .join('\n');
}

function copyMenu(slug) {
  return `<div class="docs-copy" data-docs-copy data-md="${mdUrl(slug)}">
            <button class="docs-copy__main" type="button" data-copy-md>Copy page</button>
            <button class="docs-copy__toggle" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="More ways to use this page">
              <svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4" /></svg>
            </button>
            <div class="docs-copy__menu" role="menu" hidden>
              <button type="button" role="menuitem" data-copy-md><strong>Copy as Markdown</strong><span>For pasting into an AI chat</span></button>
              <a role="menuitem" href="${mdUrl(slug)}" target="_blank" rel="noopener"><strong>View as Markdown</strong><span>The plain-text page</span></a>
              <a role="menuitem" data-llm="chatgpt" href="#" target="_blank" rel="noopener"><strong>Open in ChatGPT</strong><span>Ask questions about this page</span></a>
              <a role="menuitem" data-llm="claude" href="#" target="_blank" rel="noopener"><strong>Open in Claude</strong><span>Ask questions about this page</span></a>
            </div>
          </div>`;
}

function pager(prev, next) {
  const link = (p, dir) =>
    p
      ? `<a class="docs-pager__${dir}" href="${pageUrl(p.slug)}"><span>${dir === 'prev' ? 'Previous' : 'Next'}</span>${escape(p.title)}</a>`
      : '<span></span>';
  return `<nav class="docs-pager" aria-label="Pages">${link(prev, 'prev')}${link(next, 'next')}</nav>`;
}

/** A complete docs page. `html` is the rendered Markdown. */
export function docsPage({ nav, page, section, html, description, prev, next }) {
  const url = pageUrl(page.slug);
  return `${head({ title: page.title, description, url })}
  <body class="docs-body">
    <a class="skip" href="#main">Skip to content</a>
    <!-- @include sprite -->
    <!-- @include nav -->

    <main id="main" class="docs wrap">
      <aside class="docs-nav" id="docs-nav" aria-label="Docs">
${sidebar(nav, page.slug)}
      </aside>
      <article class="docs-main">
        <div class="docs-top">
          <button class="docs-menu-btn" type="button" aria-controls="docs-nav" aria-expanded="false">Docs menu</button>
          <p class="docs-crumb">Docs <span aria-hidden="true">/</span> ${escape(section.title)}</p>
          ${copyMenu(page.slug)}
        </div>
        <div class="prose">
${html}
        </div>
        ${pager(prev, next)}
      </article>
    </main>

    <!-- @include footer -->
    <script type="module" src="/src/main.ts"></script>
    <script type="module" src="/src/docs.ts"></script>
  </body>
</html>
`;
}
