# Teamtrail landing page

Static marketing site for [teamtrail.app](https://teamtrail.app): Vite + TypeScript, no framework. Three pages share one stylesheet and one script:

- `index.html`: Home, the story (trail, party, Scout, you) and what's coming.
- `features/index.html`: everything that ships today, and the upcoming directions in detail.
- `guides/index.html`: the guide marketplace story and its waitlist.
- `cloud/index.html`: Teamtrail Cloud (coming soon), with Scout on a pixel cloud (`src/cloudScene.ts`) and its own waitlist.

Shared markup lives in `partials/` (`sprite`, `nav`, `footer`) and is pasted in at build time by `<!-- @include name -->` (see `vite.config.ts`).

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
npm run preview    # serves dist/ on http://localhost:4173
```

Requires Node 20+.

## Waitlist

The `/guides` form posts `{ email }` to `/api/waitlist`, a Vercel serverless function (`api/waitlist.ts`) that adds the address to a Resend audience. It validates the email, ignores bots that fill the hidden honeypot field, and treats an address already on the list as success. `npm run dev` serves the same function locally.

It needs two server-side env vars (never exposed to the browser):

| Variable                   | Value                                                                                                          |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`           | A Resend API key with access to Audiences                                                                      |
| `RESEND_AUDIENCE_ID`       | The id of the audience that collects signups (Resend → Audiences)                                              |
| `RESEND_CLOUD_AUDIENCE_ID` | Optional: a separate audience for the `/cloud` waitlist. Without it, Cloud signups go to `RESEND_AUDIENCE_ID`. |

Set them in Vercel (project → Settings → Environment Variables, for Production and Preview) and, for local dev, in `.env.local` (git-ignored). Without them the form says the waitlist isn't configured.

## Product media

Screenshots and the explainer video (`landing-journey-720.mp4` and its poster) live in `public/media/`; favicons and the OG image in `public/media/brand/`. Both come from the real product on a real project (`scripts/lib/realProject.mjs`): the dev seed in a temp folder, the built `teamtrail` server, and real MCP agents (`scripts/dev-agent.mjs` in the product repo) that the scripts answer in the inbox. Nothing is simulated.

```bash
(cd ../teamtrail && npm install && npm run build -w teamtrail)   # once, and after CLI or app changes
npm run media              # here: every screenshot
npm run journey            # here: the hero video and poster (needs ffmpeg)
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

Production is https://teamtrail.app (Vercel project `teamtrail`). Pushes to `main` deploy it through `.github/workflows/deploy.yml` once the `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` secrets are set; by hand: `npx vercel build --prod && npx vercel deploy --prebuilt --prod`.

## License

[FSL-1.1-ALv2](LICENSE). The Teamtrail and Scout names and artwork are trademarks and aren't covered by the license.
