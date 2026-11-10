// Generates the docs from content/docs: one HTML page per entry in nav.json (docs/<slug>/index.html, the
// introduction at docs/index.html), the raw Markdown at public/docs/<slug>.md, and public/llms.txt plus
// public/llms-full.txt. All outputs are generated (git-ignored); edit content/docs and they follow.
// vite.config.ts runs this before every build and dev start, and again when content/docs changes in dev.
// DOCS_CONTENT=<folder> reads the Markdown from another folder (for trying the layout with sample pages).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { frontmatter, renderMarkdown, summary } from './render.mjs';
import { lastmod } from '../seo/lastmod.mjs';
import { docsPage, mdUrl, pageUrl } from './template.mjs';

const SITE = 'Teamtrail';
const TAGLINE = 'A local trail map for big work done by AI coding agents.';

const placeholder = (title) =>
  `# ${title}\n\nThis page is being written. In the meantime, see the [README on GitHub](https://github.com/teamtrailhq/teamtrail).\n`;

function write(file, text) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

const contentDir = (root) => process.env.DOCS_CONTENT ?? join(root, 'content/docs');

/** Reads every page (or a placeholder when its file doesn't exist yet), in sidebar order. */
function readPages(root, nav) {
  return nav.sections.flatMap((section) =>
    section.pages.map((page) => {
      const file = join(contentDir(root), `${page.slug}.md`);
      const raw = existsSync(file) ? readFileSync(file, 'utf8') : placeholder(page.title);
      const { meta, body } = frontmatter(raw);
      const sum = summary(body);
      const withTitle = sum.title ? body : `# ${page.title}\n\n${body}`;
      return {
        page,
        section,
        markdown: withTitle.trim() + '\n',
        description: meta.description || sum.description || `${page.title}: ${SITE} documentation.`,
        title: meta.title || undefined,
        modified: lastmod(root, [`content/docs/${page.slug}.md`]),
      };
    }),
  );
}

const ABOUT = [
  'Teamtrail works with Claude Code, Codex and any MCP client. A human describes a trail; agents chart it as a map of decision tickets (research, prototype, junction, task, execute, review) with blocking edges, claim tickets over MCP, ask the human questions and record decisions with evidence. The human steers in the Lookout, a web app served on their machine by the `teamtrail` CLI. Scout is the voice of Teamtrail: briefings, questions and status.',
  '',
  "Install: run `npx teamtrail@next` in a project folder (Node.js 20 or newer; until launch the CLI is published under the `next` tag), then connect an agent with `npx teamtrail@next connect claude` or `npx teamtrail@next connect codex`. State is plain files in the repo's `.teamtrail/` folder, or in GitHub Issues or Linear. Teamtrail never calls a model itself and never starts agents on your machine.",
];

/** /llms.txt in the llmstxt.org format: H1, summary, details, then sections of links with one line each. */
function llmsIndex(siteUrl, pages, nav) {
  const lines = [`# ${SITE}`, '', `> ${TAGLINE}`, '', ...ABOUT, ''];
  lines.push(
    '## Site',
    '',
    `- [Home](${siteUrl}/): What Teamtrail is, how a trail works and the FAQ.`,
    `- [Features](${siteUrl}/features/): Everything the Lookout does today.`,
    `- [Guides](${siteUrl}/guides/): Reviewer, QA, security and docs guides for tickets, and the catalog.`,
    `- [Teamtrail Cloud](${siteUrl}/cloud/): Hosted trails that keep running while you're away (coming soon).`,
    '',
  );
  for (const section of nav.sections) {
    lines.push(`## Docs: ${section.title}`, '');
    for (const p of pages.filter((x) => x.section === section))
      lines.push(`- [${p.page.title}](${siteUrl}${mdUrl(p.page.slug)}): ${p.description}`);
    lines.push('');
  }
  lines.push(
    '## Optional',
    '',
    `- [All docs in one file](${siteUrl}/llms-full.txt): Every docs page above, in sidebar order.`,
    '- [Source on GitHub](https://github.com/teamtrailhq/teamtrail): The `teamtrail` CLI, MCP server and Lookout.',
    '- [npm package](https://www.npmjs.com/package/teamtrail): `teamtrail`, the command you install.',
    '',
  );
  return lines.join('\n');
}

/** Writes all docs outputs; returns the HTML entry files for Vite's build inputs. */
export function generateDocs({ root, siteUrl }) {
  const nav = JSON.parse(readFileSync(join(contentDir(root), 'nav.json'), 'utf8'));
  const pages = readPages(root, nav);
  rmSync(join(root, 'docs'), { recursive: true, force: true });
  rmSync(join(root, 'public/docs'), { recursive: true, force: true });

  const inputs = {};
  pages.forEach((p, i) => {
    const html = docsPage({
      nav,
      page: p.page,
      section: p.section,
      html: renderMarkdown(p.markdown),
      description: p.description,
      title: p.title,
      modified: p.modified,
      prev: pages[i - 1]?.page,
      next: pages[i + 1]?.page,
    });
    const rel = pageUrl(p.page.slug).replace(/^\//, '') + 'index.html';
    write(join(root, rel), html);
    inputs[`docs-${p.page.slug}`] = join(root, rel);
    write(join(root, 'public', mdUrl(p.page.slug)), p.markdown);
  });

  write(join(root, 'public/llms.txt'), llmsIndex(siteUrl, pages, nav));
  const full = pages.map((p) => `<!-- ${siteUrl}${pageUrl(p.page.slug)} -->\n\n${p.markdown}`).join('\n\n');
  write(join(root, 'public/llms-full.txt'), `# ${SITE} docs\n\n> ${TAGLINE}\n\n${ABOUT.join('\n')}\n\n${full}`);
  return inputs;
}
