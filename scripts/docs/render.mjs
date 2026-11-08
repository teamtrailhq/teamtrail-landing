// Markdown → HTML for the docs pages, at build time: heading ids with anchor links, code blocks with a language
// label and a Copy button. No client-side markdown.
import { Marked } from 'marked';

const escape = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** `Heading text` → `heading-text`; repeated ids get -2, -3 … so every anchor is unique on the page. */
function slugger() {
  const seen = new Map();
  return (text) => {
    const base =
      text
        .toLowerCase()
        .replace(/<[^>]+>/g, '')
        .replace(/&[a-z]+;/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-') || 'section';
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}

/** Splits optional `---` frontmatter (title, description) from the body. */
export function frontmatter(md) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(md);
  if (!m) return { meta: {}, body: md };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { meta, body: md.slice(m[0].length) };
}

/** The first `# Heading` and the first plain paragraph, for the title and the meta description. */
export function summary(body) {
  const title = /^#\s+(.+)$/m.exec(body)?.[1]?.trim();
  const para = body
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .find((b) => b && !/^(#|>|```|\||-|\*|\d+\.|<)/.test(b));
  const plain = para
    ?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ');
  return { title, description: plain };
}

export function renderMarkdown(body) {
  const slug = slugger();
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        if (depth === 1) return `<h1>${html}</h1>\n`;
        const id = slug(html);
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-label="Link to this section">#</a>${html}</h${depth}>\n`;
      },
      code({ text, lang }) {
        const label = (lang || 'text').split(/\s/)[0];
        return `<div class="code"><div class="code__bar"><span>${escape(label)}</span><button class="code__copy" type="button">Copy</button></div><pre><code>${escape(text)}</code></pre></div>\n`;
      },
      table(token) {
        const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
        // Each cell carries its column name, so phones can stack a row as a card (src/docs.css).
        const labels = token.header.map((c) => escape(c.text.replace(/[`*_]/g, '')));
        const cell = (c, i) => `<td data-label="${labels[i]}">${this.parser.parseInline(c.tokens)}</td>`;
        const rows = token.rows.map((r) => `<tr>${r.map(cell).join('')}</tr>`).join('');
        const stack = token.header.length > 2 ? ' table--stack' : '';
        return `<div class="table${stack}"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        const attrs = external ? ' target="_blank" rel="noopener"' : '';
        const t = title ? ` title="${escape(title)}"` : '';
        return `<a href="${escape(href)}"${t}${attrs}>${text}</a>`;
      },
    },
  });
  return marked.parse(body);
}
