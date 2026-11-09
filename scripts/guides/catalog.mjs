// The guide catalog for /guides, read at build time from the public catalog (github.com/teamtrailhq/teamtrail-guides):
// index.json, reported.json and each guide's file for its checklist and checks. When the network is down, the
// committed snapshot (content/guides/catalog.json) is used instead, so builds never break. `npm run guides:snapshot`
// refreshes the snapshot. vite.config.ts pastes the rendered cards over `<!-- @guide-cards -->`.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RAW = 'https://raw.githubusercontent.com/teamtrailhq/teamtrail-guides/main';
const REPO = 'https://github.com/teamtrailhq/teamtrail-guides';
const TIMEOUT_MS = 8000;
const BUILTIN_ORDER = ['reviewer', 'qa', 'security', 'docs', 'architect'];
const snapshotFile = (root) => join(root, 'content/guides/catalog.json');

async function get(path, as) {
  const res = await fetch(`${RAW}/${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return as === 'json' ? res.json() : res.text();
}

const unquote = (s) => s.trim().replace(/^(["'])(.*)\1$/, '$2');
const inlineList = (s) =>
  s
    .trim()
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map(unquote)
    .filter(Boolean);

/**
 * The YAML subset guide frontmatter uses: `key: scalar`, `key: [a, b]`, `- item` lists and indented maps. Enough
 * for the fields the cards show; the Teamtrail CLI's own parser and lint are the authority.
 */
export function parseFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!m) return {};
  const lines = m[1].split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
  const indent = (l) => l.length - l.trimStart().length;
  function block(start, depth) {
    const out = lines[start]?.trimStart().startsWith('- ') ? [] : {};
    let i = start;
    while (i < lines.length && indent(lines[i]) >= depth) {
      const line = lines[i].trim();
      if (Array.isArray(out)) {
        out.push(unquote(line.slice(2)));
        i++;
        continue;
      }
      const kv = /^([\w-]+):\s*(.*)$/.exec(line);
      if (!kv) {
        i++;
        continue;
      }
      const [, key, value] = kv;
      if (value) {
        out[key] = value.startsWith('[') ? inlineList(value) : unquote(value);
        i++;
        continue;
      }
      const next = lines[i + 1];
      if (!next || indent(next) <= indent(lines[i])) {
        out[key] = '';
        i++;
        continue;
      }
      const [child, end] = block(i + 1, indent(next));
      out[key] = child;
      i = end;
    }
    return [out, i];
  }
  return block(0, 0)[0];
}

function toGuide(entry, fm, reported) {
  const proposed = fm.proposedChecks && typeof fm.proposedChecks === 'object' ? fm.proposedChecks : {};
  const required = Array.isArray(fm.requiresChecks) ? fm.requiresChecks : [];
  const names = [...new Set([...required, ...Object.keys(proposed)])];
  return {
    id: entry.id,
    name: entry.name,
    version: entry.version,
    summary: entry.summary,
    author: entry.author,
    builtin: entry.builtin === true,
    verified: entry.verified === true,
    reported: reported.includes(entry.id),
    types: entry.types ?? [],
    source: `${REPO}/blob/main/${entry.path}`,
    checklist: Array.isArray(fm.checklist) ? fm.checklist : [],
    checks: names.map((name) => ({
      name,
      run: Array.isArray(proposed[name]?.run) ? proposed[name].run.join(' ') : '',
    })),
  };
}

/** Fetches the live catalog. Throws when it can't be read. */
export async function fetchCatalog() {
  const index = await get('index.json', 'json');
  const reported = await get('reported.json', 'json').catch(() => []);
  const ids = Array.isArray(reported) ? reported.map((r) => (typeof r === 'string' ? r : r?.id)) : [];
  const guides = await Promise.all(
    index.guides.map(async (entry) => toGuide(entry, parseFrontmatter(await get(entry.path, 'text')), ids)),
  );
  // Built-ins first, in the order the site introduces them, then the rest by name.
  const order = (g) => (g.builtin ? BUILTIN_ORDER.indexOf(g.id) >>> 0 : Infinity);
  guides.sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
  return { repo: index.repo ?? REPO, guides };
}

/** The live catalog, or the committed snapshot when it can't be fetched. */
export async function loadCatalog(root) {
  try {
    return { ...(await fetchCatalog()), live: true };
  } catch (err) {
    console.warn(`[guides] catalog not reachable (${err.message}); using the snapshot`);
    return { ...JSON.parse(readFileSync(snapshotFile(root), 'utf8')), live: false };
  }
}

/** `npm run guides:snapshot`: writes the live catalog to the committed snapshot. */
export async function writeSnapshot(root) {
  const catalog = await fetchCatalog();
  writeFileSync(snapshotFile(root), JSON.stringify(catalog, null, 2) + '\n');
  return catalog;
}
