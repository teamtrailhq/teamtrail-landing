// Terminal and Claude Code scenes for the journey video. `type` lines are typed after the prompt.
import { connectLines, startLines } from '../lib/connectLines.mjs';

const CC = '> ';

/** Setup once: connect Claude Code. `version` is the capture's server's. */
export const SETUP = ({ version }) => connectLines({ version, project: 'fieldnote-app' });

/** Then start Teamtrail: what the capture's server printed (`started`), so its version and address are real. */
export const START = ({ started }) => [
  { t: 'npx teamtrail', type: true },
  { t: '' },
  ...startLines(started),
  { t: '', pause: 1600 },
];

export const FRAME = [
  { t: '✻ Welcome to Claude Code', cls: 'acc box' },
  { t: '  cwd: ~/fieldnote-app · MCP: teamtrail connected', cls: 'dim' },
  { t: '' },
  { t: '/scout new "Team workspaces for Fieldnote"', type: true, prompt: CC },
  { t: '● teamtrail · ask_human (framing: true)', cls: 'ok' },
  { t: '  ⎿ Trail draft opened · also live in the Lookout', cls: 'dim' },
  { t: '● Scout 1/4  Who is this for?', cls: 'scout' },
  { t: 'Team admins at companies already using Fieldnote.', type: true, prompt: CC },
  { t: '● Scout 2/4  What does done look like?', cls: 'scout' },
  { t: 'A team shares notebooks with roles, and admins sign in with SSO.', type: true, prompt: CC },
  { t: '● Scout 3/4  What is out of scope for now?', cls: 'scout' },
  { t: 'Native desktop apps and billing changes.', type: true, prompt: CC },
  { t: '● teamtrail · start_trail ("Ship team workspaces", 8 tickets)', cls: 'ok' },
  { t: '● Trail #18 is mapped. One decision is waiting on you.', cls: 'scout', pause: 1600 },
];

/** Coming back: the same command, the same start. */
export const AGAIN = START;

export const RESUME = [
  { t: '✻ Welcome back to Claude Code', cls: 'acc box' },
  { t: '' },
  { t: '/scout resume', type: true, prompt: CC },
  { t: '● teamtrail · resume_trail (#18)', cls: 'ok' },
  { t: '  ⎿ Inbox clear · 1 decision logged · 2 tickets unblocked', cls: 'dim' },
  { t: '● teamtrail · claim_ticket (#22)', cls: 'ok' },
  { t: '  ⎿ Claimed #22 Spike the riskiest integration point', cls: 'dim', pause: 1500 },
];

export const CHECK_IN = [
  { t: '/scout status', type: true, prompt: CC },
  { t: '● teamtrail · status', cls: 'ok' },
  { t: '  #18 Ship team workspaces · 3 of 8 decided' },
  { t: '  Running   claude-33 · #22 Spike the riskiest integration point', cls: 'dim' },
  { t: '  Spend     $2.84 · 712k tokens', cls: 'dim' },
  { t: '' },
  { t: '/scout inbox', type: true, prompt: CC },
  { t: '● teamtrail · list_inbox', cls: 'ok' },
  { t: '  1 waiting on you' },
  { t: '  #23 What does "done" look like for v1?', cls: 'scout', pause: 1600 },
];
