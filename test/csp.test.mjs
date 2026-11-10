import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { contentSecurityPolicy, cspProblems, hashOf, inlineScriptHashes } from '../scripts/security/csp.mjs';
import { EVERYWHERE, withSecurityHeaders } from '../scripts/security/headers.mjs';

const page = `<html><head>
<script>boot()</script>
<script type="module" src="/assets/main.js"></script>
<script defer src="/_vercel/insights/script.js"></script>
<script type="application/ld+json">{"@type":"WebSite"}</script>
<script type="module">later()</script>
</head></html>`;

test('hashes the inline scripts that run, and nothing else', () => {
  assert.deepEqual(inlineScriptHashes(page), [hashOf('boot()'), hashOf('later()')]);
  // A known vector: sha256 of "alert(1)".
  assert.equal(hashOf('alert(1)'), `'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='`);
});

test('the policy lists each hash once and never allows inline or eval', () => {
  const csp = contentSecurityPolicy([hashOf('b'), hashOf('a'), hashOf('b')]);
  assert.equal(csp.split(hashOf('b')).length, 2);
  assert.ok(csp.startsWith(`default-src 'none'; script-src 'self' `));
  assert.ok(!csp.includes('unsafe'));
  assert.ok(csp.includes(`frame-ancestors 'none'`));
});

test('flags what the policy would block in a page', () => {
  assert.deepEqual(cspProblems('<p class="a">style="x" is only text here</p>'), []);
  assert.equal(cspProblems('<div style="color: red"></div>').length, 1);
  assert.equal(cspProblems('<style>p{}</style><button onclick="go()">').length, 2);
});

test('sets the headers on the catch-all rule and keeps the other rules', () => {
  const config = { headers: [{ source: '/assets/(.*)', headers: [] }], redirects: [1] };
  const next = withSecurityHeaders(withSecurityHeaders(config, [{ key: 'A', value: 'old' }]), [
    { key: 'A', value: 'b' },
  ]);
  assert.deepEqual(next.headers, [
    { source: EVERYWHERE, headers: [{ key: 'A', value: 'b' }] },
    { source: '/assets/(.*)', headers: [] },
  ]);
  assert.deepEqual(next.redirects, [1]);
});

test('the committed vercel.json sends a hash-only policy on every path', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const rule = config.headers.find((r) => r.source === EVERYWHERE);
  const sent = Object.fromEntries(rule.headers.map((h) => [h.key, h.value]));
  assert.match(sent['Content-Security-Policy'], /script-src 'self'( 'sha256-[A-Za-z0-9+/]{43}=')+;/);
  assert.equal(sent['X-Content-Type-Options'], 'nosniff');
  assert.equal(sent['X-Frame-Options'], 'DENY');
  assert.ok(sent['Referrer-Policy'] && sent['Permissions-Policy']);
});
