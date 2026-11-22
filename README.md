# Teamtrail landing page

Static marketing site for [teamtrail.app](https://www.teamtrail.app): Vite + TypeScript, no framework. The pages share one stylesheet and one script:

- `index.html`: Home, the story (trail, party, Scout, you) and what's coming.
- `features/index.html`: everything that ships today, and the upcoming directions in detail.
- `guides/index.html`: guides, with one card per guide in the public catalog (see [Guide cards](#guide-cards)); each card opens its details in a dialog (`src/guideDialog.ts`).
- `cloud/index.html`: Teamtrail Cloud (early access): what it offers today and what's next, and its own waitlist. Its hero scene shows the team signed in and checks run on an agent's commit around Scout in his square frame, and the journey scene closes the laptop while the trail goes on and the phone answers what needs you (Scout mounted by `src/cloudScene.ts`).
- `slack/index.html`: Scout in Slack, Teamtrail's Slack app: what it does in Slack, what stays on your machine, and Add Scout to Slack. Three scenes: a question answered with a button in a Slack thread while it leaves Needs you, @Scout answering from your machine only while Teamtrail runs, and a high-risk question showing Open in Lookout.
- `mobile/index.html`: Teamtrail for mobile, coming with Teamtrail Cloud: the hero, a showcase of what the app does, what stays private, and the Cloud waitlist. Every phone is drawn in CSS (`.device`, one shared block in `src/scenes-mobile.css`: a rounded graphite body and a pill, the screen inside keeping the site's square corners). The hero fills Needs you across workspaces while a high-risk question arrives as a notification and joins the list (`partials/scene-mobile-needs.html`). The showcase (`data-showcase`, `src/scenes/showcase.ts`) is one phone between four cards (answer with Face ID, approve and merge, every trail at a glance, only what needs you); each card is a button for one pane on the phone's screen (`partials/scene-mobile-answer.html`, `-merge`, `-trails`, `-notify`), and each pane is a scene. Hover, focus or a press shows that pane and plays it from the start, taking the page's turn (`claim` in `src/scenes/turns.ts`); left alone on screen it moves to the next card after each turn, and a pointer or keyboard focus holds the card. With reduced motion the cards switch stills; without scripts the first card shows. Below 900px the phone comes first, with the chosen card's line under it and the cards in a 2×2 grid. Sequencers in `src/scenes/mobile*Scene.ts`.
- `privacy/index.html`: the privacy policy for the site, Scout and Teamtrail Cloud.
- `/docs/`: the docs, written as Markdown in `content/docs` (order and sections in `content/docs/nav.json`) and built into `docs/<slug>/index.html` pages by `scripts/docs/generate.mjs` (see [Search and LLMs](#search-and-llms)).

Shared markup lives in `partials/` (`sprite`, `nav`, `footer`) and is pasted in at build time by `<!-- @include name -->` (see `vite.config.ts`). The sprite holds the logo mark (`#tt-logo`: six block cursors around an open centre, the one pointing up grey, the other five blaze, on transparency, the same in both themes), alone, for square spaces. Spaces wider than tall, like the nav, the footer and the hero video's title and end cards, take the `teamtrail` wordmark: that mark followed by the name in Inter 600 with tight tracking, no cursor after it (`.brand__word`, the mark 0.86em square and 0.24em before the name). Never the name alone without the mark, except in running text and accessibility labels.

The look is dark-first: near-black surfaces, hairline borders, square corners and one accent, blaze (`#FF6B2C`; a darker `#C2410C` for text on day), with rose only for what needs you and green only for what passed (tokens at the top of `src/styles.css`). Type is Inter (with its optical-size axis, so headlines get the display cut) for everything and JetBrains Mono for commands, code and labels, both self-hosted through `@fontsource`. Page heroes and the closing section sit on a CSS dot grid. Home's How it works cards and the Done means proven section, each section of /features, the ticket on /guides, /slack and /cloud show animated product scenes instead of screenshots: stylised fragments of the Lookout in HTML and CSS (`partials/scene-*.html`, styles in `src/scenes.css`, `src/scenes-pages.css` for /features and /guides, `src/scenes-slack.css` and `src/scenes-cloud.css` for /slack and /cloud), each played by a small sequencer that adds and removes classes (`src/scenes/`). The scenes take turns (`src/scenes/turns.ts`): one plays at a time on the page, the on-screen ones in document order, and nothing plays off screen or in a hidden tab. The markup is each scene's still frame, which is what shows without scripts or with reduced motion. A scene's root goes back to its markup after each turn, so a live widget (Scout) sits outside it or is mounted again (`src/keepMounted.ts`). JS adds the install box that types through `npx teamtrail` and the Claude Code and Codex connect commands (`src/cmdCycle.ts`), the looping explainer video (muted, no controls, paused off-screen), the badge scramble, scroll reveals, copy buttons, the Scout avatar and the waitlist form. The pages read fine without it.

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

Screenshots and the explainer video (`landing-journey-720.mp4` and its poster) live in `public/media/`; favicons and the OG image in `public/media/brand/`. The favicons, OG image, avatar and app icon are exported from the product repo's `packages/scout-avatar` (`npm run capture`, its `brand/` folder); `favicon.svg` is its `logoFaviconSvg()` (the logo mark on transparency, the same on light and dark tabs), and the PNGs and `public/favicon.ico` (16, 32 and 48 px) are the same mark for browsers without SVG icons. The apple-touch-icon is `app-icon-512.png`, the mark on the near-black tile, since iOS wants an opaque square; `cloud-icon-{dark,light}-512.png` come from Cloud's `scripts/brand-icons.mjs`. /mobile has its own share image, `og-mobile-1200x630.png`, rendered from the built page's hero phone by `npm run og:mobile` (`scripts/og-mobile.mjs`; build and `npm run preview -- --port 4319` first); every other page keeps the shared one. Bump the `?v=` on the icon links (and in `scripts/docs/template.mjs`) when they change. Both come from the real product on a real project (`scripts/lib/realProject.mjs`): the dev seed in a git repo at `/Users/Shared/code/fieldnote-app` (`CAPTURE_CODE_DIR` to change it; its paths show in the shots, so one capture runs at a time), the built `teamtrail` server with a worktree per claimed ticket, and three real MCP agents (`scripts/dev-agent.mjs` in the product repo) that the scripts answer in Hands-off's Needs you list and in the bubble on the map. The shots of the map switch to Hands-on first (Hands-off is the default). Nothing is simulated.

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

Production is https://www.teamtrail.app (Vercel project `teamtrail`; the bare teamtrail.app redirects there). Pushes to `main` deploy it through `.github/workflows/deploy.yml` once the `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` secrets are set. Only `main` deploys production: PRs from branches in this repo, and manual runs on other branches, get a preview. The workflow pins its actions to commit SHAs and the Vercel CLI to one version (`VERCEL_CLI`); bump them on purpose. By hand: `npx vercel build --prod && npx vercel deploy --prebuilt --prod`.

## Security headers

`vercel.json` sends a Content-Security-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a Referrer-Policy, a Permissions-Policy and `Cross-Origin-Opener-Policy` on every path (Vercel adds `Strict-Transport-Security` itself). The policy (`scripts/security/csp.mjs`) allows the site's own files, the GitHub API for the star count, and the inline scripts by sha256 hash; there is no `'unsafe-inline'`, so pages can't carry `style=""` attributes, `<style>` elements or inline event handlers, and the build fails if one does.

Vercel reads `vercel.json` before it builds, so the headers are committed. The `security-headers` plugin (`scripts/security/headers.mjs`) recomputes them from the built pages on every build: when an inline script changes, `npm run build` rewrites `vercel.json` (commit it), and in CI a stale file fails the build instead of shipping a policy that blocks the site's own scripts. A new third-party script, embed, font or API host needs its source added in `csp.mjs`.

Check it in a real Chrome, every page type in both themes, with the video, copy buttons, docs links and the waitlist:

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

[MIT](LICENSE). The Teamtrail and Scout names and artwork are trademarks and aren't covered by the license.

## Sign in to Cloud (off until launch)

The nav and `/cloud` have Sign in links to Teamtrail Cloud, left out of every build until Cloud is live. To try them against local Cloud (`npm run dev` in teamtrail-cloud, at `http://app.localhost:7600`):

```sh
CLOUD_SIGN_IN=1 CLOUD_APP_URL=http://app.localhost:7600 npm run dev
```

At launch, set `CLOUD_SIGN_IN=1` for Production in Vercel (the links then go to `https://app.teamtrail.app`) and redeploy.
