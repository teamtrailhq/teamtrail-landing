// Vercel serverless function: POST /api/waitlist adds an email to a Resend audience. Server-only env (Vercel
// project settings, or .env.local in dev):
//   RESEND_API_KEY            a Resend API key with access to Audiences
//   RESEND_AUDIENCE_ID        the audience that collects waitlist signups (the default list, and the fallback)
//   RESEND_CLOUD_AUDIENCE_ID  optional: a separate audience for the /cloud waitlist (`list: "cloud"`)
//   WAITLIST_ALLOWED_ORIGINS  optional: extra origins allowed to post, comma-separated (https://staging.example.com)
//
// Abuse controls, in the order they run: JSON only, from the site's own origin, a small body, a best-effort
// per-IP limit, the honeypot, then a strict email check. The real per-IP limit is a Vercel Firewall rule on
// this path (README, "Waitlist"): the one here lives in one function instance's memory, so it only slows a
// burst that lands on the same warm instance. Keep this file self-contained: every file in api/ is a function.

/** The form sends about 100 bytes. Anything bigger isn't the form. */
const MAX_BODY_BYTES = 1024;
const MAX_EMAIL = 254;
const MAX_LOCAL_PART = 64;
const PRODUCTION_ORIGINS = ['https://www.teamtrail.app', 'https://teamtrail.app'];
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
/** Best effort, per function instance: signups one address may send in a window. */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_KEYS = 5000;
const UPSTREAM_TIMEOUT_MS = 8000;

const hits = new Map<string, { count: number; resetAt: number }>();

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });

const SEND_JSON = { error: 'Send JSON: { "email": "you@company.com" }.' };
const BAD_EMAIL = { error: 'That email address doesn’t look right.' };
const TRY_AGAIN = { error: 'Couldn’t add you right now. Please try again.' };

/** A preview answers only its own pages: the deployment's URL and its branch alias. */
function previewOrigins(): string[] {
  const hosts = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL];
  return hosts.filter(Boolean).map((host) => `https://${host}`);
}

/** The origins this deployment's own pages are served from. */
function allowedOrigins(): Set<string> {
  const extra = (process.env.WAITLIST_ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim().replace(/\/$/, ''));
  const own = process.env.VERCEL_ENV === 'preview' ? previewOrigins() : PRODUCTION_ORIGINS;
  return new Set([...own, ...extra].filter(Boolean));
}

/** Off Vercel (`npm run dev`, `vercel dev`, tests) any localhost port may post. */
function isLocalDev(origin: string): boolean {
  const env = process.env.VERCEL_ENV;
  if (env === 'production' || env === 'preview') return false;
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/**
 * True when the request comes from one of our own pages. Browsers always send Origin on a POST made by fetch,
 * and Sec-Fetch-Site where they support it; a script can forge both, so this stops other sites from posting
 * through a visitor's browser, not a determined client. That is the rate limit's job.
 */
function fromOwnPage(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return false;
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return allowedOrigins().has(origin) || isLocalDev(origin);
}

/** Reads the body as text, or returns undefined once it passes the cap. Never buffers more than the cap. */
async function readCapped(request: Request): Promise<string | undefined> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (!Number.isFinite(declared) || declared > MAX_BODY_BYTES) return undefined;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      return undefined;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

const isLabelChar = (c: number) => (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 45;

/** One pass over a lowercased domain: dot-separated labels of a-z, 0-9 and hyphens, and a top level of 2+. */
function isDomain(domain: string): boolean {
  let labelLength = 0;
  let labels = 0;
  for (let i = 0; i < domain.length; i++) {
    const c = domain.charCodeAt(i);
    if (c === 46) {
      if (labelLength === 0) return false;
      labels++;
      labelLength = 0;
      continue;
    }
    if (!isLabelChar(c)) return false;
    labelLength++;
  }
  return labels >= 1 && labelLength >= 2;
}

/**
 * A linear-time shape check, length first: one "@", a local part without spaces or control characters, and a
 * plausible domain. No regex, so no input can make it backtrack.
 */
function isEmail(email: string): boolean {
  if (email.length < 6 || email.length > MAX_EMAIL) return false;
  const at = email.indexOf('@');
  if (at < 1 || at > MAX_LOCAL_PART || at !== email.lastIndexOf('@')) return false;
  for (let i = 0; i < at; i++) {
    const c = email.charCodeAt(i);
    if (c <= 32 || c === 127) return false;
  }
  return isDomain(email.slice(at + 1));
}

/** Vercel sets both headers itself, so a client can't choose its own key there. */
function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return request.headers.get('x-real-ip') ?? forwarded ?? 'unknown';
}

/** Best effort only (see the top of the file). Returns the seconds to wait when the caller is over the limit. */
function overLimit(key: string, now: number): number | undefined {
  const hit = hits.get(key);
  if (hit && hit.resetAt > now) {
    hit.count++;
    return hit.count > RATE_LIMIT ? Math.ceil((hit.resetAt - now) / 1000) : undefined;
  }
  if (hits.size >= RATE_MAX_KEYS) {
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    // Still full of live keys: drop the oldest rather than grow without bound.
    if (hits.size >= RATE_MAX_KEYS) hits.delete(hits.keys().next().value as string);
  }
  hits.delete(key);
  hits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
  return undefined;
}

async function addContact(args: { key: string; audience: string; email: string }): Promise<boolean> {
  try {
    const r = await fetch(`https://api.resend.com/audiences/${args.audience}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${args.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: args.email, unsubscribed: false }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    // Already on the list counts as success, so the answer never says whether an address was listed.
    if (r.ok || r.status === 409) return true;
    console.error('resend', r.status, (await r.text().catch(() => '')).slice(0, 300));
  } catch (err) {
    console.error('resend', err instanceof Error ? err.name : 'error');
  }
  return false;
}

function parseBody(text: string): { email?: unknown; company?: unknown; list?: unknown } | undefined {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request): Promise<Response> {
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') return json(415, SEND_JSON);
  if (!fromOwnPage(request)) return json(403, { error: 'Sign up from the Teamtrail site.' });

  const text = await readCapped(request);
  if (text === undefined) return json(413, { error: 'That request is too large.' });
  const wait = overLimit(clientKey(request), Date.now());
  if (wait !== undefined) {
    return json(429, { error: 'Too many tries. Please wait a few minutes.' }, { 'Retry-After': String(wait) });
  }

  const key = process.env.RESEND_API_KEY;
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audience) return json(503, { error: 'Waitlist is not configured.' });

  const body = parseBody(text);
  if (!body) return json(400, SEND_JSON);
  // Honeypot: a hidden field people never fill in. Pretend it worked so bots learn nothing.
  if (typeof body.company === 'string' && body.company) return json(200, { ok: true });
  if (typeof body.email !== 'string' || body.email.length > MAX_EMAIL + 16) return json(400, BAD_EMAIL);
  const email = body.email.trim().toLowerCase();
  if (!isEmail(email)) return json(400, BAD_EMAIL);

  const target = (body.list === 'cloud' && process.env.RESEND_CLOUD_AUDIENCE_ID) || audience;
  if (await addContact({ key, audience: target, email })) return json(200, { ok: true });
  return json(502, TRY_AGAIN);
}
