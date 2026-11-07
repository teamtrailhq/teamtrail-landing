# CLI commands

Every `teamtrail` command and flag.

```text
teamtrail [options]
teamtrail mcp [--dir <path>] [--agent <trail name>] [--lease-minutes <n>]
teamtrail connect claude|codex [--dir <path>]
teamtrail connect slack [options]
teamtrail knowledge import <file.md> [--dir <path>]
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

| Option                 | Default                              |                                                                                           |
| ---------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `--dir <path>`         | `./.teamtrail` (or `$TEAMTRAIL_DIR`) | Tracker folder.                                                                           |
| `--agent <trail name>` | from the MCP client                  | Fix the session name (otherwise `claude-01`, `codex-01`, …).                              |
| `--lease-minutes <n>`  | `15` (or `$TEAMTRAIL_LEASE_MINUTES`) | A claimed ticket returns to the queue after this long without a tool call from its agent. |

## teamtrail connect claude | codex

Registers the MCP server with Claude Code or Codex and installs the [`/scout` command](/docs/scout-commands/). For Claude Code it also adds a `SessionStart` hook, so usage comes from the session transcript. Takes `--dir <path>`.

## teamtrail connect slack

Starts the Lookout on the [Slack](/docs/slack/) setup. It takes the same options as `teamtrail`.

## teamtrail knowledge import

```bash
teamtrail knowledge import docs/spec.md
```

Seeds [project knowledge](/docs/discovery-and-knowledge/) from a markdown document: one `suggested` entry per `##` section, for you to review in the Lookout. Takes `--dir <path>`.

## teamtrail hook claude

The `SessionStart` hook itself, run by Claude Code with the hook payload on stdin. You don't run it by hand.
