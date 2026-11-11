---
title: Connect Claude Code, Codex or any MCP agent · Teamtrail docs
description: Register the Teamtrail MCP server with Claude Code, Codex or any MCP client in one command, and add the /scout command to your agent's chat.
---

# Connect your agent

Register the Teamtrail MCP server with Claude Code or Codex, and add the `/scout` command.

The `teamtrail` package ships an MCP server, `teamtrail mcp`, that your agent starts over stdio. Run `teamtrail` in the repo as well to watch the agent live and answer its questions in the Lookout. The agent and the Lookout can start in any order.

## Claude Code

The quickest way:

```bash
npx teamtrail@next connect claude
```

This does four things:

- registers the server, pinned to the version you ran: `claude mcp add teamtrail -- npx -y teamtrail@<version> mcp`, so Claude Code never starts a newer one by surprise (run `connect` again from a newer version to update);
- writes the `/scout` command to `.claude/commands/scout.md` in the repo;
- adds a silent `SessionStart` hook to `.claude/settings.local.json`, so tokens and cost come from the session transcript;
- keeps Claude Code out of Teamtrail's config folder (below).

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

With a custom `CODEX_HOME`, `connect codex` forwards it to the server so session logs can be found. Like `connect claude`, it registers the version you ran.

It also prints a permissions profile that keeps Codex's commands out of Teamtrail's config folder. Until you add it, they can read that folder, the machine key included: see below.

## Keep agents out of the config folder

Teamtrail's [config folder](/docs/personal-settings/) holds this machine's key, which signs your answers, approvals and trail state, plus your tracker credentials. An agent that can read it can approve for itself. So `connect` keeps the agent out of it. Pass `--no-protect-config` to skip this.

**Claude Code.** `connect claude` adds deny rules to Claude Code's user settings (`~/.claude/settings.json`): `Read` and `Edit` rules for the folder in `permissions.deny`, and the folder in `sandbox.filesystem.denyRead` and `denyWrite` for sandboxed commands. It keeps what's already there, adds nothing twice, and prints what it added and how to remove it.

The rules are best effort unless Claude Code's sandbox is on. Without it, they stop Claude's own file tools, but a shell command such as `cat` can still read the folder.

**Codex.** Codex can deny a folder only through a default permissions profile, which changes how it sandboxes every folder. That's your call, so `connect codex` only prints the profile to add to `~/.codex/config.toml`:

```toml
default_permissions = "teamtrail"
[permissions.teamtrail]
extends = ":workspace"
[permissions.teamtrail.filesystem]
"/Users/you/.config/teamtrail" = "deny"
```

Until you add it, Codex's commands can read the folder, `machine.key` included. Its workspace-write sandbox already keeps them from writing there.

Teamtrail's own MCP server isn't affected by either: agents don't apply these rules to the MCP servers they start. With a custom `$TEAMTRAIL_CONFIG_DIR`, the default `~/.config/teamtrail` is denied too.

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
| `--no-register`        |                                           | Don't add this repo to All projects.                       |

`connect claude|codex` also accepts `--dir <path>`; it's passed to the server only when it isn't the default.

## Agents on other machines

An agent on another machine or in a cloud sandbox can't start the server next to your repo. It connects over HTTP instead, with a token you create in the Lookout:

```bash
npx -y teamtrail@next connect claude --url https://trail.example.com/mcp
```

See [Remote agents](/docs/remote-agents/) for the setup and what to put in front of it.

## Your other repos

When the server or `connect` starts, it adds its repo to the list of projects in your config folder, so one Lookout shows every repo you work in: see [All projects](/docs/all-projects/). Pass `--no-register` (to `mcp` or `connect`) or set `TEAMTRAIL_NO_REGISTER` to opt out.

## Usage and cost

Tokens and cost per session are read from the agent's own local logs and priced at list rates (tagged `LOG`):

- **Claude Code:** the session transcript in `~/.claude/projects/` (or `$CLAUDE_CONFIG_DIR`), matched to the repo by the `SessionStart` hook.
- **Codex:** the session rollout in `~/.codex/sessions/` (or `$CODEX_HOME`), found from the tool call's thread id.

Other agents can report usage through `report_progress` (tagged `SELF`). Nothing leaves your machine.

## Next

Start a trail: [Your first trail](/docs/first-trail/).
