---
title: Approvals and security · Teamtrail docs
description: What only you approve in Teamtrail, where those approvals live, how check commands run, which answers count as your decisions, and what Teamtrail protects against and what it doesn't.
---

# Approvals and security

Agents can edit the files in your repo, and teammates push them. So what decides how work moves counts on your machine only once you approved it there.

## What only you approve

| What                                                                     | Where you approve it                                       | Until then                                                                                               |
| ------------------------------------------------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Check commands in `verification.json`                                    | **Settings → Project → Approvals**, or `teamtrail approve` | No check runs. Completions wait (`waiting-approval`); the work is kept.                                  |
| A risk policy that lowers what needs you                                 | Approvals                                                  | The stricter levels hold.                                                                                |
| A verification level lowered below the one you approved                  | Approvals                                                  | The approved level holds.                                                                                |
| Briefs marked accepted, criteria marked confirmed, knowledge marked live | Approvals (or accept them in the Lookout as usual)         | They open no gate and don't reach agents as trusted.                                                     |
| A trail that runs without discovery                                      | Approvals, on its own                                      | Discovery gates it.                                                                                      |
| Guide catalogs in `guides.json`                                          | Approvals, on its own                                      | The catalogs it adds aren't searched.                                                                    |
| Trail files changed outside Teamtrail                                    | Approvals: **Accept this change** or **Revert**            | Teamtrail uses the values it signed. See [Changes outside Teamtrail](#changes-outside-teamtrail).        |
| `trackers.json` naming another tracker, repo or team                     | Approvals: **Use** the new one or **Keep** the current one | Nothing is read from or sent to the new one.                                                             |
| Guides and the check commands they propose                               | **Settings → Project → Guides**, or `teamtrail guides add` | Agents can't use the guide; its checks don't run. See [Guides](/docs/guides/#approval-and-pinning).      |
| Settings someone else changed on a GitHub or Linear issue                | Waiting on you: **Accept as is** or **Keep stricter**      | Your accepted settings stay in force. See [GitHub Issues and Linear](/docs/trackers/#who-counts-as-you). |

Approvals is at `?settings=approvals`, and anything waiting there also shows in [Waiting on you](/docs/waiting-on-you/) as a `trust` item. Check commands and changed trail files block work, so they rank high.

### Where approvals live

In your [config folder](/docs/personal-settings/), under `projects/<project id>/`, never in the repo. An agent that can only write repo files, or a teammate's push, can't approve anything for you.

- Each item shows exactly what it would approve: the commands, the lowered levels, the changed fields (old → new). Approving records what you saw. If the files change while you read, the page says so and asks you to **Review again**.
- A repo moved to another folder is asked again.
- Approvals are made on the machine Teamtrail runs on. A paired phone sees them but can't approve them.

### The first run

On a fresh clone, a new machine or the upgrade, committed files say they were approved somewhere else. Approvals then offers **Approve all N committed** to adopt them in one step.

- It covers only content committed in git, as committed. An uncommitted change is shown whole and approved on its own.
- It never includes a trail that runs without discovery, guide catalogs, or check commands Teamtrail can't place or the lint warns about. Those are approved one at a time.
- It lasts until your first approval. After that, each item is approved on its own.

### In a terminal

```bash
teamtrail approve
```

Shows each item waiting, exactly as it would be approved, and asks `y/N` for each. Without a terminal (CI, a server) it approves nothing unless you name an item by the hash it printed:

```bash
teamtrail approve --hash sha256:…
```

An agent that can run the CLI can pass a printed hash too. That's why [`connect`](#keep-agents-out-of-the-config-folder) keeps agents out of the config folder, where approvals are written.

## Check commands

The commands in [`verification.json`](/docs/verification-json/) run on your machine when an agent completes work.

- **They run only once approved here.** A new or changed command waits in Approvals. Until you approve it, completions end with `waiting-approval` and the agent moves on; nothing is lost.
- **They get an allowlisted environment:** the shell, locale and toolchain basics (`PATH`, `HOME`, `LANG`, `NODE_*`, proxies, …). Tokens, keys and anything named like a secret are left out, and so are Teamtrail's own credentials.
- **Extra variables come from your machine, not the repo.** Name them in `TEAMTRAIL_CHECK_ENV` where you start `teamtrail`:

  ```bash
  TEAMTRAIL_CHECK_ENV="DATABASE_URL, REDIS_URL, APP_*" teamtrail
  ```

  An exact name passes even if it looks like a secret: that's your call. A pattern such as `APP_*` passes what it matches, except names that look like secrets. A failed check's log ends with the names of the variables it didn't get, never their values.

**The honest limit.** Checks run as you, without a sandbox. The allowlist keeps secrets out of the environment, but a check can still read files your account can read (`~/.aws`, `~/.ssh`, `~/.npmrc`, Teamtrail's `credentials.json`) and reach your SSH agent. And approval covers the command line, not what it runs: `npm run check` runs `package.json` scripts, which an agent can edit. Approve commands you'd run yourself, and review changes to what they run.

## Your decisions

Teamtrail never answers or approves for you. What counts as your call:

- **Answers count toward gates only when you give them in the Lookout or Slack.** You can also answer in an agent's chat: the agent passes your words on with `answer_question`, and the Lookout shows them. A chat answer guides agents, but it never passes a gate: a high-risk decision, or closing a ticket that's yours to decide, needs your answer in the Lookout or Slack.
- **Tickets that need a person close only with your answer.** A junction, a prototype or a HITL task closes only after you answered, in the Lookout or Slack, a question the agent asked on that ticket.
- **Skipping discovery, or changing a trail's mode or destination, is a request.** When an agent asks for it, you get a request to **Approve** or **Decline** in the Lookout or Slack. Nothing changes until you approve, and no answer to a question stands in for it. Meanwhile the trail carries on as it is.
- **A trail that runs without discovery needs its own approval.** It's never part of approving everything at once.

## Changes outside Teamtrail

With the default markdown tracker, a trail is plain files in `.teamtrail/`. What gates read counts only as Teamtrail wrote it on your machine, through the Lookout or an agent's MCP tools. Teamtrail keeps a signed record of it in your config folder.

If an agent or a teammate edits these fields in the files directly, the edit has no effect until you decide:

- a ticket's type, its human (HITL) flag, its blockers, claim, state and status, and how it was closed;
- a trail's mode, destination, verification level and guides;
- decisions and assumptions.

The ticket is held, the signed values apply, and **Settings → Approvals** shows what changed (old → new) with **Accept this change** and **Revert**. **Revert** writes the signed values back into the file. A ticket added by copying a file in is held until you accept it, or delete it after confirming the file by name.

- **Text edits are marked, not held.** Titles, bodies and comments can be edited freely; the ticket inspector says **Text edited outside Teamtrail**.
- **Decisions read from text show as Unverified.** A resolution comment or a line in Decisions so far was written by whoever could edit the files, so the Logbook never shows it as your call.
- **Teammates.** A teammate's pushed change shows as changed outside Teamtrail on every other machine until it's accepted there. On a fresh clone, a new machine or the upgrade, existing trails are adopted with the [first run](#the-first-run).

GitHub Issues and Linear use the tracker's own authorship instead: see [Who counts as you](/docs/trackers/#who-counts-as-you).

## Devices on your network

With [`--host`](/docs/sign-in/#other-devices), a paired phone or laptop can read the trail, answer questions, approve finished work and edit text. Of what gates read, it can only change a ticket's status, or close or reopen it. It can't create trails or tickets.

It never changes what runs on your machine or whom it trusts. These are set on the machine itself, and Settings says so:

- Approvals, the tracker connection and anything looked up with its credentials;
- Slack;
- the risk policy and verification levels;
- workspaces;
- installing and approving guides, and a ticket's guide;
- remote agents' tokens, and pairing or revoking browsers;
- your attention settings;
- the projects list.

What a device reads leaves out absolute paths and the tracker account.

## Guides

- A proposed check that runs a program Teamtrail doesn't know needs your acknowledgement: **I know what it runs**. In the CLI, it's asked only at a terminal.
- A guide from another catalog shows **Verified by `<host>`'s catalog**: that catalog's own review, not Teamtrail's. **Verified** alone means the official catalog's maintainers reviewed it.
- `guides.json` is an approval item: the catalogs it adds are searched only once you approve it.

See [Guides](/docs/guides/).

## Keep agents out of the config folder

Your config folder holds this machine's key, which signs your answers, approvals and trail state, plus your tracker credentials. [`teamtrail connect`](/docs/connect-your-agent/#keep-agents-out-of-the-config-folder) keeps the agents it registers out of it:

- **Claude Code:** deny rules in `~/.claude/settings.json`. Without Claude Code's sandbox they stop its own file tools, but a shell command can still read the folder.
- **Codex:** it prints a permissions profile to add. Until you add it, Codex's commands can read the folder, the machine key included.

## Slack

Nothing is sent to Slack, and nobody can act from it, until you confirm the owner: you get a one-time code in the Lookout, enter it on Scout's Home tab in Slack, then confirm that account in the Lookout. See [Slack](/docs/slack/).

## Security model and limits

Teamtrail protects against:

- **an agent that can only write files in the repo**: it can't approve its own checks, briefs or criteria, change gate fields, or record your decisions;
- **a teammate's push**: committed approvals and state changes wait for you on your machine;
- **other devices on your network**: they need pairing, and even then can't change what runs on your machine or whom it trusts;
- **other programs on your machine reaching the Lookout**: they need a paired browser's session, which is never a cookie and is sent only to a server that proved it is your Lookout.

It doesn't protect against:

- **an agent that can read your config folder**: it can read the machine key, make a pairing code and approve for itself;
- **a program that can read your browser's profile** on disk: it can copy a session;
- **an unrestricted shell on your account**: anything that runs as you can do what you can. Any local agent can also pass your words with `answer_question`; those answers guide, but never pass a gate.

Run agents in a sandbox that blocks the config folder where you can. Where the sandbox blocks it, Teamtrail fails closed and tells both you and the agent why.
