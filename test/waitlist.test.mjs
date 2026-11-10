// The waitlist function's abuse controls, with Resend mocked: nothing here reaches the network.
import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { POST } from '../api/waitlist.ts';

const SITE = 'https://www.teamtrail.app';
const realFetch = globalThis.fetch;
let calls;
let ip = 0;

/** Answers Resend's contacts call with `status`, recording what the function sent. */
function mockResend(status = 201) {
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response('{}', { status });
  };
}

/** A request as the site's form sends it, from a fresh IP so the per-IP guard doesn't cross tests. */
function post(body, headers = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  return POST(
    new Request(`${SITE}/api/waitlist`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: SITE,
        'sec-fetch-site': 'same-origin',
        'x-real-ip': `203.0.113.${++ip}`,
        ...headers,
      },
      body: payload,
    }),
  );
}

beforeEach(() => {
  calls = [];
  process.env.RESEND_API_KEY = 're_test';
  process.env.RESEND_AUDIENCE_ID = 'aud_main';
  for (const name of ['RESEND_CLOUD_AUDIENCE_ID', 'VERCEL_ENV', 'VERCEL_URL', 'VERCEL_BRANCH_URL']) {
    delete process.env[name];
  }
  mockResend();
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

test('adds a valid address to the audience, trimmed and lowercased', async () => {
  const r = await post({ email: '  Ada@Example.COM ', company: '' });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/audiences/aud_main/contacts');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer re_test');
  assert.deepEqual(JSON.parse(calls[0].init.body), { email: 'ada@example.com', unsubscribed: false });
});

test('the cloud list goes to its own audience when one is set', async () => {
  process.env.RESEND_CLOUD_AUDIENCE_ID = 'aud_cloud';
  await post({ email: 'ada@example.com', list: 'cloud' });
  assert.equal(calls[0].url, 'https://api.resend.com/audiences/aud_cloud/contacts');
});

test('an address already on the list answers exactly like a new one', async () => {
  const fresh = await post({ email: 'ada@example.com' });
  mockResend(409);
  const listed = await post({ email: 'ada@example.com' });
  assert.equal(listed.status, fresh.status);
  assert.equal(await listed.text(), await fresh.text());
});

test('rejects a body over the cap from its Content-Length, without reading or parsing it', async () => {
  const r = await post({ email: 'ada@example.com', pad: 'x'.repeat(2000) });
  assert.equal(r.status, 413);
  assert.equal(calls.length, 0);
});

test('stops reading a streamed body that passes the cap with no Content-Length', async () => {
  let pulled = 0;
  const body = new ReadableStream({
    pull(controller) {
      pulled++;
      controller.enqueue(new TextEncoder().encode('x'.repeat(512)));
    },
  });
  const request = new Request(`${SITE}/api/waitlist`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: SITE, 'x-real-ip': '203.0.113.250' },
    body,
    duplex: 'half',
  });
  const r = await POST(request);
  assert.equal(r.status, 413);
  assert.ok(pulled < 10, `read ${pulled} chunks of an endless body`);
});

test('a huge "email" is refused quickly: length is checked before the shape', async () => {
  const started = performance.now();
  const r = await post({ email: `${'a.'.repeat(400)}@x` });
  assert.equal(r.status, 400);
  assert.ok(performance.now() - started < 100);
  assert.equal(calls.length, 0);
});

test('refuses requests that are not JSON', async () => {
  const r = await post('email=ada@example.com', { 'content-type': 'application/x-www-form-urlencoded' });
  assert.equal(r.status, 415);
  assert.equal((await post('not json')).status, 400);
  assert.equal((await post('"a string"')).status, 400);
  assert.equal(calls.length, 0);
});

test('refuses other origins, a missing Origin and cross-site fetches', async () => {
  const body = { email: 'ada@example.com' };
  assert.equal((await post(body, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(body, { origin: 'https://www.teamtrail.app.evil.example' })).status, 403);
  assert.equal((await post(body, { origin: '' })).status, 403);
  assert.equal((await post(body, { 'sec-fetch-site': 'cross-site' })).status, 403);
  assert.equal((await post(body, { 'sec-fetch-site': 'same-site' })).status, 403);
  assert.equal(calls.length, 0);
});

test('accepts the production hosts, and browsers that send no Sec-Fetch-Site', async () => {
  process.env.VERCEL_ENV = 'production';
  assert.equal((await post({ email: 'ada@example.com' }, { 'sec-fetch-site': '' })).status, 200);
  assert.equal((await post({ email: 'ada@example.com' }, { origin: 'https://teamtrail.app' })).status, 200);
});

test('a preview accepts its own deployment and branch URLs only', async () => {
  process.env.VERCEL_ENV = 'preview';
  process.env.VERCEL_URL = 'teamtrail-abc123-team.vercel.app';
  process.env.VERCEL_BRANCH_URL = 'teamtrail-git-branch-team.vercel.app';
  const body = { email: 'ada@example.com' };
  assert.equal((await post(body, { origin: 'https://teamtrail-abc123-team.vercel.app' })).status, 200);
  assert.equal((await post(body, { origin: 'https://teamtrail-git-branch-team.vercel.app' })).status, 200);
  assert.equal((await post(body, { origin: 'https://teamtrail-other-team.vercel.app' })).status, 403);
  assert.equal((await post(body, { origin: SITE })).status, 403);
  assert.equal((await post(body, { origin: 'http://localhost:5173' })).status, 403);
});

test('local dev may post from localhost, but production never accepts it', async () => {
  const body = { email: 'ada@example.com' };
  assert.equal((await post(body, { origin: 'http://localhost:4173' })).status, 200);
  assert.equal((await post(body, { origin: 'http://127.0.0.1:5173' })).status, 200);
  process.env.VERCEL_ENV = 'production';
  assert.equal((await post(body, { origin: 'http://localhost:4173' })).status, 403);
});

test('rejects addresses that are not email-shaped', async () => {
  const bad = ['', 'ada', 'ada@', '@example.com', 'ada@example', 'ada@example.c', 'a da@example.com'];
  bad.push('ada@@example.com', 'ada@exa mple.com', 'ada@.example.com', 'ada@example..com', 'ada@exam_ple.com');
  bad.push(`${'a'.repeat(65)}@example.com`, `ada@${'a'.repeat(250)}.com`, 'ada@example.com/x', 'ada\u0000@example.com');
  for (const email of bad) assert.equal((await post({ email })).status, 400, JSON.stringify(email));
  assert.equal((await post({ email: 42 })).status, 400);
  assert.equal((await post({})).status, 400);
  assert.equal(calls.length, 0);
});

test('accepts ordinary addresses', async () => {
  for (const email of ['a@b.co', 'first.last+tag@sub.example.co.uk', 'o’brien@example.com', 'x@xn--bcher-kva.de']) {
    assert.equal((await post({ email })).status, 200, email);
  }
});

test('the honeypot answers ok without adding anyone', async () => {
  const r = await post({ email: 'bot@example.com', company: 'Acme' });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(calls.length, 0);
});

test('an upstream failure is a 502 that says nothing about the address', async () => {
  mockResend(500);
  const failed = await post({ email: 'ada@example.com' });
  assert.equal(failed.status, 502);
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed');
  };
  const down = await post({ email: 'grace@example.com' });
  assert.equal(down.status, 502);
  assert.equal(await down.text(), await failed.text());
});

test('says so when the Resend env is missing', async () => {
  delete process.env.RESEND_API_KEY;
  assert.equal((await post({ email: 'ada@example.com' })).status, 503);
});

test('the best-effort guard slows one address after five tries in a window', async () => {
  const from = { 'x-real-ip': '198.51.100.7' };
  for (let i = 0; i < 5; i++) assert.equal((await post({ email: `a${i}@example.com` }, from)).status, 200);
  const r = await post({ email: 'a6@example.com' }, from);
  assert.equal(r.status, 429);
  assert.ok(Number(r.headers.get('retry-after')) > 0);
  assert.equal((await post({ email: 'other@example.com' })).status, 200);
  assert.equal(calls.length, 6);
});
