---
title: CLI commands · Teamtrail docs
description: Every teamtrail command and flag: start the Lookout, connect agents, run the MCP server over stdio or HTTP, manage projects and guides.
---

# CLI commands

Every `teamtrail` command and flag.

```text
teamtrail [options]
teamtrail mcp [--dir <path>] [--agent <trail name>] [--lease-minutes <n>] [--no-register]
teamtrail mcp --http [--port <n>] [--host <addr>] [--allow-host <name>] [--dir <path>]
teamtrail connect claude|codex [--dir <path>] [--no-register] [--no-protect-config]
teamtrail connect claude|codex --url <http(s)://host:port/mcp> [--token-stdin | --token <token>] [--allow-http] [--no-protect-config]
teamtrail projects add [path] | list | remove <id|path>
teamtrail connect slack [options]
teamtrail knowledge import <file.md> [--dir <path>]
teamtrail approve [--hash <hash>]… [--dir <path>]
teamtrail pair [--dir <path>] [--no-open]
teamtrail guides list|search|add|new|update|remove|lint … [--dir <path>]
```

## teamtrail

Starts the Lookout for the current folder at `http://127.0.0.1:<port>/`, opens your browser on its sign-in page ready to sign in with one click, and prints a one-time **Sign in** link for another browser. See [Sign in to the Lookout](/docs/sign-in/).

| Option            | Default                              |                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dir <path>`    | `./.teamtrail` (or `$TEAMTRAIL_DIR`) | Tracker folder.                                                                                                                                                                                                   |
| `--port <n>`      | `7420`                               | Port. Without the flag, the next free port is used if it's taken; with it, a taken port is an error.                                                                                                              |
| `--host <addr>`   | `127.0.0.1`                          | IP address to bind; a host name is refused. `0.0.0.0` (or `::`) means each of the machine's network addresses at start. Other devices still need to be paired. See [Other devices](/docs/sign-in/#other-devices). |
| `--no-open`       |                                      | Don't open the browser.                                                                                                                                                                                           |
| `-v`, `--version` |                                      | Print the version.                                                                                                                                                                                                |
| `-h`, `--help`    |                                      | Show the help.                                                                                                                                                                                                    |

## teamtrail mcp

Serves the MCP server for coding agents over stdio. Agents start it themselves; see [Connect your agent](/docs/connect-your-agent/).

| Option                 | Default                              |                                                                                                        |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `--dir <path>`         | `./.teamtrail` (or `$TEAMTRAIL_DIR`) | Tracker folder.                                                                                        |
| `--agent <trail name>` | from the MCP client                  | Fix the session name (otherwise `claude-01`, `codex-01`, …).                                           |
| `--lease-minutes <n>`  | `15` (or `$TEAMTRAIL_LEASE_MINUTES`) | A claimed ticket returns to the queue after this long without a tool call from its agent.              |
| `--no-register`        |                                      | Don't add this repo to [All projects](/docs/all-projects/) on start (or set `$TEAMTRAIL_NO_REGISTER`). |

## teamtrail mcp --http

Serves the same MCP tools over streamable HTTP, for agents on other machines or in cloud sandboxes, until you press Ctrl+C. Nothing else is served on the port. Every request needs a token created in **Settings → Project → Remote agents**; with no token it answers 401. See [Remote agents](/docs/remote-agents/).

| Option                | Default     |                                                                                                                                      |
| --------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `--port <n>`          | `7421`      | Port; the path is `/mcp`. Without the flag, the next free port is used if it's taken; with it, a taken port is an error.             |
| `--host <addr>`       | `127.0.0.1` | IP address to bind. The connection is plain HTTP: put it behind HTTPS (a reverse proxy or a tunnel) before agents elsewhere use it.  |
| `--allow-host <name>` |             | A host name the endpoint answers to, such as your proxy's or tunnel's. Repeat it for more. `localhost` and IP addresses always work. |

`--dir`, `--lease-minutes` and `--no-register` work as above. `--agent` isn't taken: every session gets its own trail name. `--port`, `--host` and `--allow-host` need `--http`.

## teamtrail connect claude | codex

Registers the MCP server with Claude Code or Codex and installs the [`/scout` command](/docs/scout-commands/). It registers this exact version (`npx -y teamtrail@<version> mcp`), so agents never start a newer one by surprise; run `connect` again from a newer version to update. For Claude Code it also adds a `SessionStart` hook, so usage comes from the session transcript. Takes `--dir <path>` and `--no-register`.

It also keeps the agent out of Teamtrail's config folder: deny rules in Claude Code's user settings, or, for Codex, a permissions profile it prints for you to add. `--no-protect-config` skips that. See [Keep agents out of the config folder](/docs/connect-your-agent/#keep-agents-out-of-the-config-folder).

Like `mcp`, it adds the repo to [All projects](/docs/all-projects/) unless `--no-register` or `$TEAMTRAIL_NO_REGISTER` is set, or auto-register is off in **Settings → Projects**.

## teamtrail connect claude | codex --url

```bash
teamtrail connect claude --url https://trail.example.com/mcp
```

Points the agent at a Teamtrail MCP server over HTTP instead of starting one, and installs the `/scout` command. See [Remote agents](/docs/remote-agents/).

| Option             |                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <endpoint>` | The endpoint, `http://` or `https://`, ending in `/mcp`. No credentials or query in it.                                                                 |
| `--token-stdin`    | Read the agent's token from stdin.                                                                                                                      |
| `--token <token>`  | The token on the command line, which lands in your shell history. Not together with `--token-stdin`.                                                    |
| `--allow-http`     | Check the token against a plain-HTTP endpoint on another machine anyway. Without it that check is skipped, because it would send the token unencrypted. |

Without either token flag, the token comes from `$TEAMTRAIL_TOKEN`. Claude Code keeps the token in its own config, so `connect claude --url` needs one. Codex stores only the variable's name and reads `$TEAMTRAIL_TOKEN` each time it starts. `--dir` and `--no-register` don't apply here: there is no local server and no repo to register.

## teamtrail connect slack

Starts the Lookout on the [Slack](/docs/slack/) setup. It takes the same options as `teamtrail`.

## teamtrail approve

```bash
teamtrail approve
```

What the repo asks this machine to trust and you haven't approved here: check commands, a risk policy that lowers what needs you, lowered verification levels, accepted briefs, confirmed criteria and knowledge, guide catalogs, trails without discovery and trail files changed outside Teamtrail. It shows exactly what each item would approve and asks `y/N` for each, like **Settings → Project → Approvals**. Without a terminal it approves only what `--hash <hash>` names exactly (repeat it for more), and exits 1 when nothing waiting has that hash. See [Approvals and security](/docs/security/).

## teamtrail pair

```bash
teamtrail pair
```

Opens a browser tab ready to sign in to the Lookout running for this folder, and prints a new one-time link for another browser. The link works once, for 10 minutes; the tab's own code, within a minute. It first checks that the server at the Lookout's address really is that Lookout. `--no-open` only prints the link. Phones and other computers pair from the Lookout instead: **Settings → You → Browsers & devices**. See [Sign in to the Lookout](/docs/sign-in/).

## teamtrail knowledge import

```bash
teamtrail knowledge import docs/spec.md
```

Seeds [project knowledge](/docs/discovery-and-knowledge/) from a markdown document: one `suggested` entry per `##` section, for you to review in the Lookout. Takes `--dir <path>`.

## teamtrail projects

The repos one Lookout supervises in [All projects](/docs/all-projects/). The list is kept in `projects.json` in your [config folder](/docs/personal-settings/), never in a repo.

| Command                      |                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `projects add [path]`        | Register a repo (default: this one, or the `--dir` folder). The path can be the repo or its tracker folder; `.teamtrail/` is created if missing. |
| `projects list`              | Every registered project with its id and path, and whether `mcp` and `connect` add their repo. The default.                                      |
| `projects remove <id\|path>` | Forget a project (`rm` works too). Its files are untouched.                                                                                      |

## teamtrail guides

Manage [guides](/docs/guides/): the roles agents take on for tickets that ask for one. Every subcommand takes `--dir <path>`.

| Command                                                                                             |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `guides list`                                                                                       | Guides agents can take on (built in, local and from a catalog), with their status.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `guides search [query] [--verified] [--registry <name>]`                                            | Search the catalogs listed in `guides.json`, then the official one (unless it says `"official": false`). Matches every word against id, name, summary and author. `--verified` leaves out guides no maintainer reviewed.                                                                                                                                                                                                                                                                                                                                                                              |
| `guides add <id>\|<catalog/id>\|<file.md> [--registry <name>] [--sha256 <hash>] [--approve-checks]` | Show the whole guide and, once you approve it, copy it into `.teamtrail/guides/` and pin it in `guides.lock.json`, after the safety lint. An id is looked up in every catalog, in order, and the output says which one it came from; an id in more than one is refused until you name it as `catalog/id` or with `--registry`. Without a terminal nothing is added unless `--sha256` names the file it printed. Each check command it proposes is asked about; without a terminal, none is approved unless `--approve-checks` is given, and a program Teamtrail doesn't know only ever at a terminal. |
| `guides new <id> [--author <name>]`                                                                 | Write your own guide: a template in `.teamtrail/guides/<id>.md` that passes the lint, signed with your git name unless `--author` is given. Agents can use it once the trail lead approves it in **Settings → Guides → Write your own**.                                                                                                                                                                                                                                                                                                                                                              |
| `guides update [id...] [--sha256 <hash>]`                                                           | Newer versions of the catalog guides approved on this machine, from the catalog each was approved from. Shows what changed and asks before installing; without a terminal, only the file `--sha256` names. New or changed check commands are asked about on their own.                                                                                                                                                                                                                                                                                                                                |
| `guides remove <id>`                                                                                | Remove an installed guide. Its approved checks stay in `verification.json`. Removing a file that replaces a built-in brings the built-in back.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `guides lint [dir\|file...] [--json]`                                                               | The schema and safety lint for guide files, each finding with its line. Without a path it lints the project's own guides. On a catalog checkout it also requires a test example per guide (`examples/<id>/`); your project's guides don't need one. Exits 1 on any error.                                                                                                                                                                                                                                                                                                                             |

```bash
teamtrail guides search accessibility --verified
teamtrail guides add a11y
teamtrail guides new perf
teamtrail guides lint
```

## teamtrail hook claude

The `SessionStart` hook itself, run by Claude Code with the hook payload on stdin. You don't run it by hand.
