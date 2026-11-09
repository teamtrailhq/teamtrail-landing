# /scout commands

The `/scout` command drives Teamtrail from your agent's chat.

`teamtrail connect claude` installs it as `.claude/commands/scout.md` in the repo. `teamtrail connect codex` installs it as a Codex prompt (`~/.codex/prompts/scout.md`), used as `/prompts:scout …`. With no arguments, it runs `status`.

| Command                 | Does                                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/scout new "<idea>"`   | Frames the idea with you, charts a trail, does discovery, then works it.                                                                                                                           |
| `/scout resume [trail]` | Picks up the trail and works ready tickets until none is ready.                                                                                                                                    |
| `/scout status`         | Progress, running sessions, what's waiting on you and what interrupts, blocked and rework tickets, spend, and one line when another of your [projects](/docs/all-projects/) has something waiting. |
| `/scout inbox`          | The ranked [Waiting on you](/docs/waiting-on-you/) list. Answer questions in the chat; everything else is decided in the Lookout.                                                                  |

## new "<idea>"

1. Checks the work is trail-sized; a bug fix or a single endpoint is done directly, unless you ask for a trail.
2. Asks 3–4 framing questions, one at a time (`ask_human` with `framing: true`): who it's for, what done looks like, what's out of scope, what's decided.
3. Drafts the map: destination, decided, not yet specified, out of scope, assumptions, the trail's team of [guides](/docs/guides/) and tickets wired with `blockedBy`, then calls `start_trail`.
4. Does discovery and calls `submit_brief`; continues once you accept it.

## resume [trail]

For each ticket, the agent:

- declares the files it will change (`touches`) and works in its workspace when it gets one;
- with [model matching](/docs/model-matching/) on, takes tickets that fit its model, and tells you when it claims one set for a stronger model;
- takes on the ticket's [guide](/docs/guides/) when the claim has one, and answers its checklist when completing;
- reads the knowledge that came with the claim, and proposes or flags knowledge;
- agrees on acceptance criteria (`set_criteria`) before implementation work;
- asks you only calls that are yours (by your [risk policy](/docs/policy-json/)), with honest urgency, and decides and records the rest;
- challenges assumptions and proposes reroutes instead of working around them;
- closes with a resolution, rationale, alternatives and evidence per criterion, and handles `rework` or `blocked` results.

## In Codex

```text
/prompts:scout new "<idea>"
/prompts:scout resume
/prompts:scout status
/prompts:scout inbox
```
