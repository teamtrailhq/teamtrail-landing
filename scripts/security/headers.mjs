// Keeps vercel.json's security headers in step with the build. Vercel reads vercel.json before it builds,
// so the headers are committed; this plugin recomputes them from the built pages (inline script hashes
// included) and, when they differ, rewrites vercel.json locally or fails the build in CI, where a stale
// policy would otherwise ship and block the site's own scripts. `npm run preview` sends the same headers.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cspProblems, inlineScriptHashes, securityHeaders } from './csp.mjs';

/** The vercel.json rule that carries the security headers: every path. */
export const EVERYWHERE = '/(.*)';

/** vercel.json with the security headers set on the catch-all rule (first, so it reads top-down). */
export function withSecurityHeaders(config, headers) {
  const others = (config.headers ?? []).filter((rule) => rule.source !== EVERYWHERE);
  return { ...config, headers: [{ source: EVERYWHERE, headers }, ...others] };
}

const serialize = (config) => `${JSON.stringify(config, null, 2)}\n`;

/** Hashes and problems across every built page. */
function inspect(bundle) {
  const hashes = [];
  const problems = [];
  for (const [file, chunk] of Object.entries(bundle)) {
    if (!file.endsWith('.html') || chunk.type !== 'asset') continue;
    const html = String(chunk.source);
    hashes.push(...inlineScriptHashes(html));
    problems.push(...cspProblems(html).map((problem) => `${file}: ${problem}`));
  }
  return { hashes, problems };
}

/** Sends vercel.json's headers from `vite preview`, so a local check sees what production sends. */
function applyHeaders(file) {
  return (req, res, next) => {
    const path = (req.url ?? '/').split('?')[0];
    const rules = JSON.parse(readFileSync(file, 'utf8')).headers ?? [];
    for (const rule of rules) {
      if (!new RegExp(`^${rule.source}$`).test(path)) continue;
      for (const { key, value } of rule.headers) res.setHeader(key, value);
    }
    next();
  };
}

/** @returns {import('vite').Plugin} */
export function securityHeadersPlugin({ root }) {
  const file = resolve(root, 'vercel.json');
  return {
    name: 'security-headers',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        const { hashes, problems } = inspect(bundle);
        if (problems.length) this.error(`The Content-Security-Policy would block:\n  ${problems.join('\n  ')}`);
        const current = readFileSync(file, 'utf8');
        const next = serialize(withSecurityHeaders(JSON.parse(current), securityHeaders(hashes)));
        if (next === current) return;
        if (process.env.CI) {
          this.error('vercel.json security headers are stale: run `npm run build` locally and commit vercel.json.');
        }
        writeFileSync(file, next);
        this.warn('vercel.json: security headers updated (an inline script changed). Commit the change.');
      },
    },
    configurePreviewServer(server) {
      server.middlewares.use(applyHeaders(file));
    },
  };
}
