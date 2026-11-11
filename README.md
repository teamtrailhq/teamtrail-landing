# Teamtrail landing page

Static marketing site for [teamtrail.app](https://www.teamtrail.app): Vite + TypeScript, no framework. The pages share one stylesheet and one script:

- `index.html`: Home, the story (trail, party, Scout, you) and what's coming.
- `features/index.html`: everything that ships today, and the upcoming directions in detail.
- `guides/index.html`: guides, with one card per guide in the public catalog (see [Guide cards](#guide-cards)); each card opens its details in a dialog (`src/guideDialog.ts`).
- `cloud/index.html`: Teamtrail Cloud (coming soon), with Scout on a pixel cloud (`src/cloudScene.ts`) and its own waitlist.

Shared markup lives in `partials/` (`sprite`, `nav`, `footer`) and is pasted in at build time by `<!-- @include name -->` (see `vite.config.ts`). The sprite holds the brand marks, coloured per theme by `--tt-wordmark-*` and `--tt-logo-*` in `src/styles.css`: `#tt-wordmark` (`teamtrail.`) for spaces wider than tall, like the nav and footer, and `#tt-logo` (`t.`) for square ones. Never both side by side.

Type is Londrina Solid for headlines, Figtree for reading and JetBrains Mono for code, both self-hosted through `@fontsource`. JS adds the hero background (`src/heroField.ts`, with the map in `src/hero/`, paused off-screen, a still frame with reduced motion), the install box that types through `npx teamtrail` and the Claude Code and Codex connect commands (`src/cmdCycle.ts`), the looping explainer video (muted, no controls, paused off-screen), the badge scramble, scroll reveals, copy buttons, the Scout avatar and the waitlist form. The pages read fine without it.

## Run

The Scout avatar comes from the product repo, so clone both side by side:

```bash
git clone https://github.com/teamtrailhq/teamtrail
git clone https://github.com/teamtrailhq/teamtrail-landing
cd teamtrail-landing
npm install
npm run dev        # http://localhost:5173, hot reload
npm run build      # dist/ (static, deploy anywhere)
npm run preview    # serves dist/ on http://localhost:4173, with vercel.json's security headers
npm test           # the waitlist function and the security headers (node:test)
```

Requires Node 20+.

## Waitlist

The `/cloud` form posts `{ email, list: "cloud" }` to `/api/waitlist`, a Vercel serverless function (`api/waitlist.ts`) that adds the address to a Resend audience. It ignores bots that fill the hidden honeypot field and treats an address already on the list as success, so its answer never says whether an address was listed. `npm run dev` serves the same function locally.

It accepts only what the site's own form sends, and refuses the rest before it reaches Resend:

- JSON only (415), from the site's own origin (403): `https://www.teamtrail.app` in production, the deployment's own URL and branch alias on a preview (`VERCEL_URL`, `VERCEL_BRANCH_URL`), any `localhost` port off Vercel. `WAITLIST_ALLOWED_ORIGINS` adds more, comma-separated. A script can forge `Origin`, so this stops other sites posting through a visitor's browser, not a determined client.
- A body of at most 1 KB (413), checked from `Content-Length` and again while reading.
- The address is length-checked, then shape-checked in one pass with no regex (400).
- At most 5 tries per IP in 10 minutes (429). This is best effort only: it lives in one function instance's memory, and Vercel runs many. The real limit is a Vercel Firewall rule, set once in the dashboard:
  1. Vercel → the `teamtrail` project → **Firewall** → **Configure** → **+ New Rule**, named `waitlist rate limit`.
  2. **If** Request Path **Equals** `/api/waitlist`.
  3. **Then** **Rate Limit**: Fixed Window, Time Window `60s`, Request Limit `5`, key **IP**, action **Too Many Requests (429)** (pick **Log** first to watch it without blocking).
  4. **Save Rule** → **Review Changes** → **Publish**.

  Rate limiting is on every plan (Hobby gets one rule); counters are per region. It can't be set in `vercel.json`, which only knows `challenge` and `deny`.

Not done: a confirmation email (double opt-in) would stop someone signing up an address that isn't theirs. It needs a sender domain in Resend first.

It needs two server-side env vars (never exposed to the browser):

| Variable                   | Value                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`           | A Resend API key with access to Audiences                                                                      |
| `RESEND_AUDIENCE_ID`       | The id of the audience that collects signups (Resend → Audiences)                                              |
| `RESEND_CLOUD_AUDIENCE_ID` | Optional: a separate audience for the `/cloud` waitlist. Without it, Cloud signups go to `RESEND_AUDIENCE_ID`. |
| `WAITLIST_ALLOWED_ORIGINS` | Optional: extra origins allowed to post, comma-separated.                                                      |

Set them in Vercel (project → Settings → Environment Variables, for Production and Preview) and, for local dev, in `.env.local` (git-ignored). Without them the form says the waitlist isn't configured.

## Guide cards

The cards on `/guides` come from the public guide catalog, [teamtrailhq/teamtrail-guides](https://github.com/teamtrailhq/teamtrail-guides): its `index.json`, `reported.json` and each guide's file (for the checklist and checks). `scripts/guides/catalog.mjs` reads them once per build or dev start, `scripts/guides/cards.mjs` renders the cards, and the `guide-cards` plugin in `vite.config.ts` pastes them over `<!-- @guide-cards -->`. When the catalog can't be reached, the build uses the committed snapshot in `content/guides/catalog.json`, so it never breaks offline. Refresh the snapshot with:

```bash
npm run guides:snapshot
```

## Product media

Screenshots and the explainer video (`landing-journey-720.mp4` and its poster) live in `public/media/`; favicons and the OG image in `public/media/brand/`. The favicons, OG image and avatar are exported from the product repo's `packages/scout-avatar` (`npm run capture`, its `brand/` folder); `favicon.svg` is its `logoFaviconSvg()` (the light mark, the dark one on dark tabs), and the PNGs and `public/favicon.ico` (16, 32 and 48 px) are the light mark for browsers without SVG icons. Bump the `?v=` on the icon links (and in `scripts/docs/template.mjs`) when they change. Both come from the real product on a real project (`scripts/lib/realProject.mjs`): the dev seed in a git repo at `/Users/Shared/code/fieldnote-app` (`CAPTURE_CODE_DIR` to change it; its paths show in the shots, so one capture runs at a time), the built `teamtrail` server with a worktree per claimed ticket, and three real MCP agents (`scripts/dev-agent.mjs` in the product repo) that the scripts answer in the inbox. Nothing is simulated.

```bash
(cd ../teamtrail && npm install && npm run build -w teamtrail)   # once, and after CLI or app changes
npm run media              # here: every screenshot
npm run journey            # here: the hero video and poster (needs ffmpeg)
THEME=night npm run media  # and again for the night set in public/media/night/
THEME=night npm run journey
```

Uses Playwright with the system Chrome (`CHROME_PATH`).

## Capture

With `npm run preview` running:

```bash
npm run capture                 # all four outputs
npm run capture -- hero mobile  # a subset: hero, desktop, mobile, video
```

The video is a scroll-through recording of Home and needs `ffmpeg` on `PATH`.

## Deploy

Production is https://www.teamtrail.app (Vercel project `teamtrail`; the bare teamtrail.app redirects there). Pushes to `main` deploy it through `.github/workflows/deploy.yml` once the `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` secrets are set. Only `main` deploys production: PRs from branches in this repo, and manual runs on other branches, get a preview. The workflow pins its actions to commit SHAs and the Vercel CLI to one version (`VERCEL_CLI`); bump them on purpose. By hand: by hand: `npx vercel build --prod && npx vercel deploy --prebuilt --prod`.

## Security headers

`vercel.json` sends a Content-Security-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a Referrer-Policy, a Permissions-Policy and `Cross-Origin-Opener-Policy` on every path (Vercel adds `Strict-Transport-Security` itself). The policy (`scripts/security/csp.mjs`) allows the site's own files, the GitHub API for the star count, and the inline scripts by sha256 hash; there is no `'unsafe-inline'`, so pages can't carry `style=""` attributes, `<style>` elements or inline event handlers, and the build fails if one does.

Vercel reads `vercel.json` before it builds, so the headers are committed. The `security-headers` plugin (`scripts/security/headers.mjs`) recomputes them from the built pages on every build: when an inline script changes, `npm run build` rewrites `vercel.json` (commit it), and in CI a stale file fails the build instead of shipping a policy that blocks the site's own scripts. A new third-party script, embed, font or API host needs its source added in `csp.mjs`.

Check it in a real Chrome, every page type in both themes, with the canvas, video, copy buttons, docs links and the waitlist:

```bash
npm run build && npm run preview -- --port 4319
BASE=http://localhost:4319 npm run verify:csp   # or BASE=<a Vercel preview URL>
```

Vercel's preview toolbar (`vercel.live`) isn't allowed by the policy, so it doesn't load on previews.

## Search and LLMs

The canonical address is `https://www.teamtrail.app` (`$SITE_URL` overrides it). `scripts/seo/seo.mjs` adds a canonical link, Twitter title and description (from the page's `og:` tags) and JSON-LD to every page at build time: Organization, WebSite, SoftwareApplication and FAQPage (read from the FAQ on Home) on Home, a BreadcrumbList on the other pages. Docs pages get a TechArticle and BreadcrumbList from `scripts/docs/template.mjs`; a doc's frontmatter can set its `title` and `description`. The build writes `sitemap.xml` (every page, lastmod from its last commit) and `robots.txt`, and `scripts/docs/generate.mjs` writes `llms.txt` and `llms-full.txt` from `content/docs`, so new pages are listed everywhere without edits. `404.html` is the not-found page and isn't indexed.

## Analytics

`scripts/analytics.mjs` adds Vercel Web Analytics to every built page: page views and referrers, with no cookies. It only records once Web Analytics is switched on for the project in Vercel (the project → Analytics → Enable).

## License

[FSL-1.1-ALv2](LICENSE). The Teamtrail and Scout names and artwork are trademarks and aren't covered by the license.
