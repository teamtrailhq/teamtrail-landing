# CLI commands

Every `teamtrail` command and flag.

```text
teamtrail [options]
teamtrail mcp [--dir <path>] [--agent <trail name>] [--lease-minutes <n>] [--no-register]
teamtrail connect claude|codex [--dir <path>] [--no-register]
teamtrail projects add [path] | list | remove <id|path>
teamtrail connect slack [options]
teamtrail knowledge import <file.md> [--dir <path>]
teamtrail guides list|search|add|update|remove|lint … [--dir <path>]
```

## teamtrail

Starts the Lookout for the current folder and opens it in your browser.

| Option            | Default                              |                                                                                                            |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `--dir <path>`    | `./.teamtrail` (or `$TEAMTRAIL_DIR`) | Tracker folder.                                                                                            |
| `--port <n>`      | `7420`                               | Port. The next free port is used if it's taken.                                                            |
| `--host <addr>`   | `127.0.0.1`                          | Interface to bind. Only expose it on networks you trust: the server can write files in the tracker folder. |
| `--no-open`       |                                      | Don't open the browser.                                                                                    |
| `-v`, `--version` |                                      | Print the version.                                                                                         |
| `-h`, `--help`    |                                      | Show the help.                                                                                             |

## teamtrail mcp

Serves the MCP server for coding agents over stdio. Agents start it themselves; see [Connect your agent](/docs/connect-your-agent/).

| Option                 | Default                              |                                                                                                        |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `--dir <path>`         | `./.teamtrail` (or `$TEAMTRAIL_DIR`) | Tracker folder.                                                                                        |
| `--agent <trail name>` | from the MCP client                  | Fix the session name (otherwise `claude-01`, `codex-01`, …).                                           |
| `--lease-minutes <n>`  | `15` (or `$TEAMTRAIL_LEASE_MINUTES`) | A claimed ticket returns to the queue after this long without a tool call from its agent.              |
| `--no-register`        |                                      | Don't add this repo to [All projects](/docs/all-projects/) on start (or set `$TEAMTRAIL_NO_REGISTER`). |

## teamtrail connect claude | codex

Registers the MCP server with Claude Code or Codex and installs the [`/scout` command](/docs/scout-commands/). For Claude Code it also adds a `SessionStart` hook, so usage comes from the session transcript. Takes `--dir <path>` and `--no-register`.

Like `mcp`, it adds the repo to [All projects](/docs/all-projects/) unless `--no-register` or `$TEAMTRAIL_NO_REGISTER` is set, or auto-register is off in **Settings → Projects**.

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

| Command                                                             |                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `guides list`                                                       | Guides agents can take on (built in, local and from a catalog), with their status.                                                                                                                                                                                       |
| `guides search [query] [--verified] [--registry <name>]`            | Search the catalogs in `guides.json` (the official one by default). Matches every word against id, name, summary and author. `--verified` leaves out guides no maintainer reviewed.                                                                                      |
| `guides add <id>\|<file.md> [--registry <name>] [--approve-checks]` | Copy a guide from a catalog (by id) or a local file into `.teamtrail/guides/` and pin it in `guides.lock.json`, after the safety lint. Each check command it proposes is shown and asked about; without a terminal, none is approved unless `--approve-checks` is given. |
| `guides update [id...] [--approve-checks]`                          | Install newer catalog versions of all pinned guides, or the named ones. Changed check commands are asked about again.                                                                                                                                                    |
| `guides remove <id>`                                                | Remove an installed guide. Its approved checks stay in `verification.json`. Removing a file that replaces a built-in brings the built-in back.                                                                                                                           |
| `guides lint <dir\|file...> [--json]`                               | The schema and safety lint for guide files, each finding with its line. On a catalog checkout it also requires a test example per guide (`examples/<id>/`). Exits 1 on any error.                                                                                        |

```bash
teamtrail guides search accessibility --verified
teamtrail guides add a11y
teamtrail guides lint ./my-guide.md
teamtrail guides add ./my-guide.md
```

## teamtrail hook claude

The `SessionStart` hook itself, run by Claude Code with the hook payload on stdin. You don't run it by hand.
