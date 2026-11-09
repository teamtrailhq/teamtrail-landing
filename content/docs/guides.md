# Guides

A guide gives the agent that claims a ticket a role: a reviewer, QA, security, docs, an architect, or one you or the community wrote. The agent gets the guide's instructions and a checklist it must answer before the work counts as done.

A guide is data, never code: instructions, a checklist and the checks it requires. It works the same for Claude Code, Codex or any MCP client.

## Built-in guides

Five guides ship with Teamtrail and need nothing installed:

| Id          | Name      | For ticket types                            | What it does                                                                  |
| ----------- | --------- | ------------------------------------------- | ----------------------------------------------------------------------------- |
| `reviewer`  | Reviewer  | `review`                                    | Independent review of another agent's finished work before it counts as done. |
| `qa`        | QA        | `task`, `execute`, `prototype`              | Tests the change like a user would and makes sure the tests cover it.         |
| `security`  | Security  | `research`, `task`, `execute`, `review`     | Looks at the change as an attacker would before it ships.                     |
| `docs`      | Docs      | `research`, `task`, `execute`               | Keeps the docs, examples and changelog true to what the code does.            |
| `architect` | Architect | `research`, `junction`, `prototype`, `task` | Shapes how the change fits the system before and while it is built.           |

A file in `.teamtrail/guides/` with a built-in's id replaces it once you approve it. Removing that file brings the built-in back.

## Giving a ticket a guide

- **A ticket asks for a guide.** Each ticket has an optional `guide`. Agents set it with `add_ticket` or `start_trail` (`guide` on each ticket); you set it in the Lookout's ticket inspector (**Guide**). The guide must be installed and active, and made for the ticket's type.
- **A trail lists its team.** A trail's team is the guides its tickets use. Agents name it once with `start_trail` (`team`); after that only you change it, in **Settings → Team of #n**. With `reviewer` on the team, the `review` tickets Teamtrail creates at `checks+review` get the reviewer guide.
- **Agents can pick by guide.** `claim_ticket` and `next_ticket` take `guides` (for example `["qa"]`) to take only tickets with one of those guides. Tickets without a guide are left out.

`list_guides` shows agents the guides they can use. Installing, approving and removing guides is yours, in the Lookout or the CLI.

## What the claiming agent gets

When a ticket has an active guide, the claim result has `guide`:

| Field                   |                                                                  |
| ----------------------- | ---------------------------------------------------------------- |
| `id`, `name`, `version` | Which guide.                                                     |
| `instructions`          | The guide's body: the role to take on.                           |
| `checklist`             | The items to answer when completing.                             |
| `requiredChecks`        | Checks from `verification.json` this guide adds to the ticket.   |
| `preferredAgent`        | Optional and advisory. Teamtrail never picks or starts an agent. |

When the ticket asks for a guide that can't be used now (not installed, not approved, edited after approval or failing the lint), the claim has a `guideWarning` instead. The agent works the ticket without guide instructions, and you see the guide in [Waiting on you](/docs/waiting-on-you/).

Guide text never overrides Teamtrail's rules: an agent still never reviews its own work, never answers or approves for you, and never edits verification or guide files.

## The checklist

When the guide has a checklist, `close_ticket`, `report_completion` and `submit_review` need `checklist`: one answer per item.

```json
"checklist": [
  { "item": "1", "done": true },
  { "item": "Listed what you did not test, and why", "done": false, "note": "No device lab for Android 9" }
]
```

`item` is the item's text (case and spacing don't matter) or its number. Every item needs an answer; `done: false` with a note counts. Teamtrail checks that each item is answered, not that the answer is true. A missing or unknown item refuses the completion with the list of what's missing.

The answers are kept in `.teamtrail/.evidence/<trail>/<ticket>/checklist.json`, and the ticket inspector shows them.

## Adding guides from the catalog

The public catalog is [teamtrailhq/teamtrail-guides](https://github.com/teamtrailhq/teamtrail-guides). Teamtrail reads its `index.json` over HTTPS; there's no server and no account.

From the CLI:

```bash
npx teamtrail@next guides search accessibility
npx teamtrail@next guides add a11y
```

In the Lookout: **Settings → Guides → Browse guides**. It shows only Verified guides by default (turn off **Verified only** to see all). Each guide shows its author, review history, checklist, the commands it proposes and its full instructions before you add it.

Adding a guide fetches the file, checks its sha256 against the catalog's index, runs the safety lint, copies it to `.teamtrail/guides/<id>.md` and pins it in `.teamtrail/guides.lock.json`. Commit both, and teammates get the same guide. A guide that fails the lint can't be added. The catalog's copies of built-in guides are for reading and are never added.

`teamtrail guides update` installs newer catalog versions. See [CLI commands](/docs/cli/#teamtrail-guides) for every subcommand.

### What the catalog labels mean

| Label        | Meaning                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------- |
| Built in     | Ships with Teamtrail and already works; the catalog's copy is for reading.               |
| Verified     | A catalog maintainer reviewed the guide's latest change.                                 |
| Not reviewed | The latest change was merged without a named reviewer. The CLI shows it as `unreviewed`. |
| Reported     | Someone reported the guide, and the maintainers are looking into it.                     |

**Report this guide** in the Lookout opens the catalog's report form.

## Writing your own

Start a guide for your team with:

```bash
npx teamtrail@next guides new perf
```

It writes `.teamtrail/guides/perf.md` from a template that already passes the safety lint, signed with your git name (`--author <name>` to sign it otherwise). Replace the placeholders with your instructions and checklist:

```md
---
v: 1
id: perf
name: Performance
version: 1.0.0
summary: Measures before and after, on a slow phone.
handles:
  types: [task, execute]
checklist:
  - Measured before and after on the same device
author: Your Name
license: MIT
---

Measure the change on the slowest device you support, before and after, and write both numbers down.
```

Check it with `teamtrail guides lint`. Without a path it lints your project's own guides.

Then approve it in the Lookout: **Settings → Guides → Write your own** lists the guides your team wrote, each as **Not approved yet** or **Approved**. Agents can't use a guide until the trail lead approves it, and again after every edit. Once it's approved, give tickets the guide `perf` or put it on a trail's team.

`guides add ./perf.md` adds a guide file from elsewhere: it runs the same lint, copies the file into `.teamtrail/guides/` and pins it.

To share a guide with everyone, open a pull request on the [public catalog](https://github.com/teamtrailhq/teamtrail-guides); its [`CONTRIBUTING.md`](https://github.com/teamtrailhq/teamtrail-guides/blob/main/CONTRIBUTING.md) explains the review. **Write your own** links to it too.

### The file format

YAML frontmatter between `---` lines, then the instructions as markdown. The frontmatter uses a small YAML subset: `key: value`, `key: [a, b]`, and indented lists or maps. Anything else is reported, never guessed.

| Key              | Required |                                                                                                                |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `v`              | yes      | `1`.                                                                                                           |
| `id`             | yes      | kebab-case, up to 40 characters. Must match the file name (`perf.md`).                                         |
| `name`           | yes      | Up to 60 characters.                                                                                           |
| `version`        | yes      | Semver, such as `1.0.0`.                                                                                       |
| `summary`        | yes      | One sentence, up to 200 characters.                                                                            |
| `handles.types`  | yes      | The ticket types it's for: `research`, `prototype`, `junction`, `task`, `execute`, `review`.                   |
| `handles.labels` | no       | Tracker labels it's meant for.                                                                                 |
| `checklist`      | no       | Up to 20 items, each up to 200 characters. Every item needs an answer on completion.                           |
| `requiresChecks` | no       | Check names from `verification.json` added to every ticket with this guide.                                    |
| `proposedChecks` | no       | Checks the guide proposes: name to `{ run, timeoutSec?, cwd? }`. They run only after you approve them (below). |
| `preferredAgent` | no       | Advisory only, up to 60 characters.                                                                            |
| `author`         | yes      | Up to 100 characters.                                                                                          |
| `license`        | yes      | Up to 60 characters, such as `MIT`.                                                                            |
| `homepage`       | no       | An `https` URL.                                                                                                |

The body holds the instructions, up to 8 KB. Unknown keys are errors, and keys that try to change what Teamtrail enforces (`verification`, `level`, `hitl`, `lifecycle`, `tools`, `permissions`, `checks`, `run`, `status`, `approve`, …) are refused.

A proposed check with its own timeout:

```yaml
requiresChecks: [a11y]
proposedChecks:
  a11y:
    run: [npx, pa11y-ci]
    timeoutSec: 600
```

### The safety lint

`guides lint` and every install check the whole file, line by line, and name the line of each finding. Any error refuses the guide.

| Rule                | Flags                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `schema`, `size`    | The fields above, the caps, an id that doesn't match the file name.                                                                      |
| `override`          | Text that tries to override or replace the agent's instructions.                                                                         |
| `answers-for-human` | Answering on the human's behalf, or `answer_question`.                                                                                   |
| `self-approval`     | Approving or passing its own work.                                                                                                       |
| `protected-file`    | Mentions of `.teamtrail/`, `verification.json`, `guides.lock.json`, `guides.json`, `policy.json`, `attention.json` or `workspaces.json`. |
| `tool-permissions`  | Skipping permissions, the sandbox, approvals, verification or checks.                                                                    |
| `exfiltration`      | Network tools (`curl`, `wget`, `scp`, …), data drop services, sending secrets.                                                           |
| `hidden-text`       | Hidden or direction-changing unicode, HTML comments and tags.                                                                            |
| `check-command`     | A proposed check that runs a shell, a network tool, inline code (`-e`, `-c`, `--eval`, …), or a `cwd` outside the repo.                  |
| `link`              | A warning, not an error: an outside URL agents may follow.                                                                               |
| `example`           | In a catalog checkout only: no test example in `examples/<id>/`.                                                                         |

## Approval and pinning

- **Checks only after you approve them.** A guide's proposed check never runs until you approve it, from the prompt in `guides add`, with `--approve-checks`, or in **Settings → Guides**. Approving writes it to `verification.json`, the only place Teamtrail runs commands from, and records its argv's hash in the lock. If a later version changes the command, you're asked again. Without a terminal, `guides add` approves nothing unless you pass `--approve-checks`.
- **Pinned by hash.** `guides.lock.json` records each guide's version, sha256, source and who added it. A guide file edited after you approved it is switched off until you look at it again (**Approve**). The same happens when its lock entry changes outside Teamtrail, for example an agent editing the file or a teammate's change pulled with git. Its tickets get a `guideWarning`, and the guide shows in Waiting on you.
- **Guides only add.** A guide can add checks and a checklist. It can't lower the verification level, drop or reorder a check, change who decides, or let an agent review its own work. A switched-off guide keeps adding the checks its approved version required.
- **Removing a guide** deletes its file and lock entry. Checks you approved stay in `verification.json`; edit that file to drop them.

## Other catalogs

`.teamtrail/guides.json` adds catalogs to search, in order. The ones it lists come first, then the official one:

```json
{
  "v": 1,
  "registries": [{ "name": "acme", "url": "https://raw.githubusercontent.com/acme/guides/main" }]
}
```

Each registry needs a `name` and an `https` URL (or `http://localhost`). Add `"official": false` to leave the official catalog out, or list it yourself (name `teamtrail`) to put it somewhere else in the order. When the file is missing, only the official catalog is used.

`guides search` and `guides add <id>` look in every catalog, in order, and `guides add` says which one the guide came from. An id in more than one catalog is refused until you pick one: `guides add acme/perf`, or `--registry acme`.

A catalog is a git repo with `guides/<id>.md`, an `examples/<id>/` test example per guide, and an `index.json` built from them.
