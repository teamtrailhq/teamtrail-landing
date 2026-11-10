// The site's Content-Security-Policy and the other security headers, built from the pages as built.
// Inline scripts (the theme boot in every head, the analytics stub) are allowed by their sha256 hash, never
// by 'unsafe-inline': change one and the build writes its new hash into vercel.json (scripts/security/headers.mjs).
import { createHash } from 'node:crypto';

/** Script types the browser runs. JSON-LD and other data blocks aren't scripts to CSP. */
const RUNS = new Set(['', 'module', 'text/javascript', 'application/javascript']);

const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

/** The CSP source for one inline script: the hash of exactly what sits between its tags. */
export const hashOf = (code) => `'sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}'`;

/** Hashes of the inline scripts a page runs, in page order. */
export function inlineScriptHashes(html) {
  const hashes = [];
  for (const [, attrs, code] of html.matchAll(SCRIPT)) {
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = /\btype\s*=\s*["']?([^"'\s>]*)/i.exec(attrs)?.[1].toLowerCase() ?? '';
    if (RUNS.has(type)) hashes.push(hashOf(code));
  }
  return hashes;
}

/**
 * What the policy would block in a page: inline styles and inline event handlers. Returned as plain
 * sentences so the build can fail on them instead of shipping a page that breaks in the browser.
 */
export function cspProblems(html) {
  const problems = [];
  if (/<style\b/i.test(html)) problems.push('a <style> element (put the rules in a stylesheet)');
  if (/<[a-z][^<>]*\sstyle\s*=/i.test(html)) problems.push('a style="" attribute (use a class)');
  if (/<[a-z][^<>]*\son[a-z]+\s*=/i.test(html)) problems.push('an inline event handler (add a listener in src/)');
  return problems;
}

/**
 * The policy. Everything is same-origin except the GitHub API (the star count, src/ghStars.ts):
 * scripts are Vite's bundles, Vercel Web Analytics (/_vercel/insights/*) and the hashed inline scripts;
 * styles and fonts are bundled; images are /media plus the data: SVG mask in the stylesheet; the waitlist
 * posts to /api/waitlist. Nothing may frame the site, and it frames nothing.
 */
export function contentSecurityPolicy(hashes) {
  const scripts = [...new Set(hashes)].sort();
  return [
    `default-src 'none'`,
    `script-src ${[`'self'`, ...scripts].join(' ')}`,
    `style-src 'self'`,
    `img-src 'self' data:`,
    `font-src 'self'`,
    `media-src 'self'`,
    `connect-src 'self' https://api.github.com`,
    `manifest-src 'self'`,
    `form-action 'self'`,
    `base-uri 'none'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
  ].join('; ');
}

/** Sensors and devices the site never uses, switched off for it and anything it might embed. */
const OFF = ['accelerometer', 'camera', 'geolocation', 'gyroscope', 'magnetometer', 'microphone', 'payment', 'usb'];

/**
 * Every security header, as vercel.json header entries. No Strict-Transport-Security here: Vercel already
 * sends `max-age=63072000` on every response, and a second header would only duplicate it.
 */
export function securityHeaders(hashes) {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(hashes) },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: OFF.map((f) => `${f}=()`).join(', ') },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ];
}
