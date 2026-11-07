// Generates the docs from content/docs: one HTML page per entry in nav.json (docs/<slug>/index.html, the
// introduction at docs/index.html), the raw Markdown at public/docs/<slug>.md, and public/llms.txt plus
// public/llms-full.txt. All outputs are generated (git-ignored); edit content/docs and they follow.
// vite.config.ts runs this before every build and dev start, and again when content/docs changes in dev.
// DOCS_CONTENT=<folder> reads the Markdown from another folder (for trying the layout with sample pages).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { frontmatter, renderMarkdown, summary } from './render.mjs';
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
      };
    }),
  );
}

function llmsIndex(siteUrl, pages, nav) {
  const lines = [`# ${SITE} docs`, '', `> ${TAGLINE}`, ''];
  for (const section of nav.sections) {
    lines.push(`## ${section.title}`, '');
    for (const p of pages.filter((x) => x.section === section))
      lines.push(`- [${p.page.title}](${siteUrl}${mdUrl(p.page.slug)}): ${p.description}`);
    lines.push('');
  }
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
  write(join(root, 'public/llms-full.txt'), `# ${SITE} docs\n\n> ${TAGLINE}\n\n${full}`);
  return inputs;
}
