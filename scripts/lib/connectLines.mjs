// `npx teamtrail connect claude`, as the published package prints it (packages/cli/src/connect.ts in the product repo),
// shortened to fit a video frame: the long explanations after each row are left out, never changed.
// The deck demo and the site's journey video both show it, so it lives here once.

/** The overlay sets lines as HTML (journey/stage.mjs), so text from the CLI is escaped. */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The connect scene's lines for `project` (the repo's folder name) on Teamtrail `version`. */
export const connectLines = ({ version, project }) => [
  { t: 'npx teamtrail connect claude', type: true },
  { t: '' },
  { t: '  Teamtrail · connect Claude Code', cls: 'acc' },
  { t: '' },
  { t: `  Project         ${project} · listed in the Lookout's All projects` },
  { t: '  /scout command  added · .claude/commands/scout.md' },
  { t: `  MCP server      registered · claude mcp add teamtrail -- npx -y teamtrail@${version} mcp` },
  { t: '  Usage hook      added · .claude/settings.local.json (tokens and cost)' },
  { t: `  Version         pinned to teamtrail@${version}: agents start exactly this version`, cls: 'dim' },
  { t: '  Config folder   protected · Claude Code’s own file tools can’t read or change it', cls: 'dim' },
  { t: '' },
  {
    t: `  In Claude Code: /scout new "${esc('<idea>')}", /scout resume, /scout status, /scout inbox`,
    cls: 'dim',
    pause: 1800,
  },
];

/**
 * What `npx teamtrail` printed when it started (the capture's own server, so the version and address are real), as
 * terminal lines. The one-time sign-in code is masked. The hint under it is the capture's `--no-open` one; a user's
 * browser opens by itself, so it shows the first sentence of theirs, which fits on one line.
 */
export const startLines = (out) =>
  out
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => ({
      t: /to sign in the browser/.test(l)
        ? `${l.match(/^\s*/)[0]}Your browser opens ready to sign in: one click, within a minute.`
        : esc(l).replace(/#pair=\S+/, '#pair=••••••••'),
      cls: /online$/.test(l.trim()) ? 'ok' : '',
    }));
