// The newest commit date (YYYY-MM-DD) of some files, for the sitemap's lastmod and the docs' dateModified.
// Falls back to today outside a git checkout or for files git doesn't know yet.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function lastmod(root, files) {
  const existing = files.filter((f) => existsSync(resolve(root, f)));
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...existing], { cwd: root })
      .toString()
      .trim();
    if (out) return out;
  } catch {
    // not a git checkout
  }
  return new Date().toISOString().slice(0, 10);
}
