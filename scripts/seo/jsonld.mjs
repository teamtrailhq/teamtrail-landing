// Schema.org data for the site. Only facts the pages already state: free, runs on your machine, npm package
// `teamtrail`, source on GitHub, works with Claude Code, Codex and any MCP agent.
const GITHUB = 'https://github.com/teamtrailhq/teamtrail';
const NPM = 'https://www.npmjs.com/package/teamtrail';
const DESCRIPTION =
  'A local trail map for big work done by AI coding agents. Claude Code, Codex or any MCP agent maps the work as decision tickets, asks you only the calls that need your judgment, and records every decision with evidence.';

const strip = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

/** Organization, WebSite and SoftwareApplication for the home page. */
export function homeGraph(siteUrl) {
  const org = `${siteUrl}/#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': org,
        name: 'Teamtrail',
        url: `${siteUrl}/`,
        logo: `${siteUrl}/media/brand/linkedin-discord-avatar-512.png`,
        sameAs: ['https://github.com/teamtrailhq', NPM],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: 'Teamtrail',
        url: `${siteUrl}/`,
        inLanguage: 'en',
        publisher: { '@id': org },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Teamtrail',
        description: DESCRIPTION,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'macOS, Linux, Windows (Node.js 20 or newer)',
        url: `${siteUrl}/`,
        downloadUrl: NPM,
        installUrl: `${siteUrl}/docs/install/`,
        softwareHelp: `${siteUrl}/docs/`,
        codeRepository: GITHUB,
        image: `${siteUrl}/media/brand/og-image-1200x630.png`,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@id': org },
        sameAs: [GITHUB, NPM],
      },
    ],
  };
}

/** FAQPage from the home page's FAQ (`<details><summary>…</summary><div>…</div></details>`), so it never drifts. */
export function faqPage(html) {
  const faq = /id="faq"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
  const items = [...faq.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<div>([\s\S]*?)<\/div>\s*<\/details>/g)];
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(([, q, a]) => ({
      '@type': 'Question',
      name: strip(q),
      acceptedAnswer: { '@type': 'Answer', text: strip(a) },
    })),
  };
}

/** Home › …crumbs, each `{ name, path }`. */
export function breadcrumbs(siteUrl, crumbs) {
  const all = [{ name: 'Teamtrail', path: '/' }, ...crumbs];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${siteUrl}${c.path}`,
    })),
  };
}
