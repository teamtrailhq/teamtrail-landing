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
teamtrail connect claude|codex [--dir <path>] [--no-register]
teamtrail connect claude|codex --url <http(s)://host:port/mcp> [--token-stdin | --token <token>] [--allow-http]
teamtrail projects add [path] | list | remove <id|path>
teamtrail connect slack [options]
teamtrail knowledge import <file.md> [--dir <path>]
teamtrail guides list|search|add|new|update|remove|lint … [--dir <path>]
```

## teamtrail

Starts the Lookout for the current folder and opens it in your browser.

| Option            | Default                              |                                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dir <path>`    | `./.teamtrail` (or `$TEAMTRAIL_DIR`) | Tracker folder.                                                                                                                                                                                                                             |
| `--port <n>`      | `7420`                               | Port. The next free port is used if it's taken.                                                                                                                                                                                             |
| `--host <addr>`   | `127.0.0.1`                          | Interface to bind. The Lookout has no sign-in, so only expose it on networks you trust, and never through a proxy or tunnel. From another device, open it by IP address: see [From another device](/docs/the-lookout/#from-another-device). |
| `--no-open`       |                                      | Don't open the browser.                                                                                                                                                                                                                     |
| `-v`, `--version` |                                      | Print the version.                                                                                                                                                                                                                          |
| `-h`, `--help`    |                                      | Show the help.                                                                                                                                                                                                                              |

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
| `--host <addr>`       | `127.0.0.1` | Interface to bind. The connection is plain HTTP: put it behind HTTPS (a reverse proxy or a tunnel) before agents elsewhere use it.   |
| `--allow-host <name>` |             | A host name the endpoint answers to, such as your proxy's or tunnel's. Repeat it for more. `localhost` and IP addresses always work. |

`--dir`, `--lease-minutes` and `--no-register` work as above. `--agent` isn't taken: every session gets its own trail name. `--port`, `--host` and `--allow-host` need `--http`.

## teamtrail connect claude | codex

Registers the MCP server with Claude Code or Codex and installs the [`/scout` command](/docs/scout-commands/). For Claude Code it also adds a `SessionStart` hook, so usage comes from the session transcript. Takes `--dir <path>` and `--no-register`.

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

| Command                                                                           |                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `guides list`                                                                     | Guides agents can take on (built in, local and from a catalog), with their status.                                                                                                                                                                                                                                                                                                                                                                    |
| `guides search [query] [--verified] [--registry <name>]`                          | Search the catalogs listed in `guides.json`, then the official one (unless it says `"official": false`). Matches every word against id, name, summary and author. `--verified` leaves out guides no maintainer reviewed.                                                                                                                                                                                                                              |
| `guides add <id>\|<catalog/id>\|<file.md> [--registry <name>] [--approve-checks]` | Copy a guide from a catalog or a local file into `.teamtrail/guides/` and pin it in `guides.lock.json`, after the safety lint. An id is looked up in every catalog, in order, and the output says which one it came from; an id in more than one is refused until you name it as `catalog/id` or with `--registry`. Each check command it proposes is shown and asked about; without a terminal, none is approved unless `--approve-checks` is given. |
| `guides new <id> [--author <name>]`                                               | Write your own guide: a template in `.teamtrail/guides/<id>.md` that passes the lint, signed with your git name unless `--author` is given. Agents can use it once the trail lead approves it in **Settings → Guides → Write your own**.                                                                                                                                                                                                              |
| `guides update [id...] [--approve-checks]`                                        | Install newer catalog versions of all pinned guides, or the named ones. Changed check commands are asked about again.                                                                                                                                                                                                                                                                                                                                 |
| `guides remove <id>`                                                              | Remove an installed guide. Its approved checks stay in `verification.json`. Removing a file that replaces a built-in brings the built-in back.                                                                                                                                                                                                                                                                                                        |
| `guides lint [dir\|file...] [--json]`                                             | The schema and safety lint for guide files, each finding with its line. Without a path it lints the project's own guides. On a catalog checkout it also requires a test example per guide (`examples/<id>/`); your project's guides don't need one. Exits 1 on any error.                                                                                                                                                                             |

```bash
teamtrail guides search accessibility --verified
teamtrail guides add a11y
teamtrail guides new perf
teamtrail guides lint
```

## teamtrail hook claude

The `SessionStart` hook itself, run by Claude Code with the hook payload on stdin. You don't run it by hand.
