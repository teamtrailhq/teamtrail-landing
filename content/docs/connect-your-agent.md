# Connect your agent

Register the Teamtrail MCP server with Claude Code or Codex, and add the `/scout` command.

The `teamtrail` package ships an MCP server, `teamtrail mcp`, that your agent starts over stdio. Run `teamtrail` in the repo as well to watch the agent live and answer its questions in the Lookout. The agent and the Lookout can start in any order.

## Claude Code

The quickest way:

```bash
npx teamtrail@next connect claude
```

This does three things:

- registers the server: `claude mcp add teamtrail -- npx -y teamtrail mcp`;
- writes the `/scout` command to `.claude/commands/scout.md` in the repo;
- adds a silent `SessionStart` hook to `.claude/settings.local.json`, so tokens and cost come from the session transcript.

Or register the server yourself:

```bash
claude mcp add teamtrail -- npx -y teamtrail mcp
```

## Codex

```bash
npx teamtrail@next connect codex
```

It installs the command as a Codex prompt (`~/.codex/prompts/scout.md`, used as `/prompts:scout …`) and registers the server, or prints the config to add by hand to `~/.codex/config.toml`:

```toml
[mcp_servers.teamtrail]
command = "npx"
args = ["-y", "teamtrail", "mcp"]
# ask_human waits for your answer; Codex cancels tool calls after 60 s by default.
tool_timeout_sec = 900
```

With a custom `CODEX_HOME`, `connect codex` forwards it to the server so session logs can be found.

## Other MCP clients

Run the server over stdio in the repo:

```bash
npx -y teamtrail mcp
```

| Flag                   | Default                                   |                                                            |
| ---------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `--dir <path>`         | `./.teamtrail` (or `$TEAMTRAIL_DIR`)      | Another tracker folder.                                    |
| `--agent <trail name>` | from the client (`claude-01`, `codex-01`) | Fix the session name.                                      |
| `--lease-minutes <n>`  | `15` (or `$TEAMTRAIL_LEASE_MINUTES`)      | How long a claim lasts without a tool call from its agent. |

`connect claude|codex` also accepts `--dir <path>`; it's passed to the server only when it isn't the default.

## Usage and cost

Tokens and cost per session are read from the agent's own local logs and priced at list rates (tagged `LOG`):

- **Claude Code:** the session transcript in `~/.claude/projects/` (or `$CLAUDE_CONFIG_DIR`), matched to the repo by the `SessionStart` hook.
- **Codex:** the session rollout in `~/.codex/sessions/` (or `$CODEX_HOME`), found from the tool call's thread id.

Other agents can report usage through `report_progress` (tagged `SELF`). Nothing leaves your machine.

## Next

Start a trail: [Your first trail](/docs/first-trail/).
