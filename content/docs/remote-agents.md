---
title: Remote agents: MCP over HTTP for agents on other machines · Teamtrail docs
description: Connect agents on other machines or in cloud sandboxes to one Teamtrail over HTTP, with one revocable token per agent, served by teamtrail mcp --http behind HTTPS.
---

# Remote agents

Agents on other machines or in cloud sandboxes can work the same trails over HTTP, each with its own token.

A local agent starts `teamtrail mcp` over stdio, next to the repo. A remote agent connects to one Teamtrail over streamable HTTP instead, and shares its trails, claims and inbox with the agents on your machine. You steer all of them in the same Lookout. This is the transport Teamtrail Cloud will use.

## Set up

Three steps. The first two happen on the machine with the repo, the third on the agent's machine.

### 1. Create a token

In the Lookout, open **Settings → Project → Remote agents** (`?settings=remote-agents`). Name the agent, for example `cloud sandbox 1`, and press **Create token**. Copy the token now: it's shown once.

Until a token exists the endpoint is closed, and every request gets a 401.

### 2. Serve the tools

In the repo:

```bash
npx teamtrail@next mcp --http
```

This serves the agent tools at `http://127.0.0.1:7421/mcp` and nothing else on that port: no Lookout and no API. It prints the endpoint and how many tokens can connect, and runs until you press Ctrl+C.

| Option                | Default     |                                                                                                                                             |
| --------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `--port <n>`          | `7421`      | Port. Without the flag, the next free port is used if it's taken; with it, a taken port is an error.                                        |
| `--host <addr>`       | `127.0.0.1` | IP address to bind; a host name is refused. The connection is plain HTTP: see [Security](#security) before you change it.                   |
| `--allow-host <name>` |             | A host name agents may reach the endpoint by: your proxy's or tunnel's. Repeat it for more names. `localhost` and IP addresses always work. |

`--dir`, `--lease-minutes` and `--no-register` work as they do for [`teamtrail mcp`](/docs/cli/#teamtrail-mcp). `--agent` isn't taken: every session gets its own trail name.

It listens on this machine only. Before an agent elsewhere can use it, put it behind HTTPS: see [Security](#security).

### 3. Connect the agent

On the agent's machine, in its checkout of the repo:

```bash
read -rs TEAMTRAIL_TOKEN && export TEAMTRAIL_TOKEN
npx -y teamtrail@next connect claude --url https://trail.example.com/mcp
```

The first line waits for the token: paste it and press Enter. It isn't shown, and it stays out of your shell history. For Codex, use `connect codex --url …`. After you create a token, Settings shows these commands ready to copy.

`connect` takes the token from the first of these it finds:

| Source             |                                                         |
| ------------------ | ------------------------------------------------------- |
| `--token-stdin`    | Read from stdin.                                        |
| `--token <token>`  | On the command line, so it lands in your shell history. |
| `$TEAMTRAIL_TOKEN` | From the environment, as above.                         |

It then registers the server with the agent, adds the [`/scout` command](/docs/scout-commands/), and checks the token against the endpoint by opening a session and ending it at once. Over plain HTTP to another machine it skips the check, because the check itself would send the token unencrypted: use `https`, or pass `--allow-http` to check anyway. The URL takes no credentials and no query: the token only ever travels in a header.

## Tokens

- **Shown once.** Teamtrail keeps only the token's SHA-256 hash, in `.teamtrail/.agents/remote-tokens.json`. That folder is git-ignored, and tokens are never written to a tracker.
- **One per agent.** Each token has its own name, so you can tell agents apart and cut one off without touching the rest. A project holds up to 50.
- **Easy to recognise.** Every token starts with `tt_`.
- **Last used.** The list shows when each token was created and when it was last used, to the minute, or **Never used**.
- **Revoke.** **Revoke** asks once more, then the token is gone: its sessions end within about a second, and it can't be brought back. Create a new one instead.
- **On the record.** Creating and revoking a token are written to the project's journal (`.events/_remote-agents.jsonl`) with the token's id and name, never its value.

Each session a remote agent opens says so in its log in the Lookout: `connected over HTTP · token "<name>"`.

## Security

### Put it behind HTTPS

`teamtrail mcp --http` speaks plain HTTP, and every request carries the token. On the machine itself that's fine. For anything further, put the port behind HTTPS with a reverse proxy or a tunnel, and tell Teamtrail the host name agents will use with `--allow-host`.

A reverse proxy, here Caddy, passing on only `/mcp`:

```text
trail.example.com {
	handle /mcp {
		reverse_proxy 127.0.0.1:7421
	}
	handle {
		respond 404
	}
}
```

```bash
npx teamtrail@next mcp --http --allow-host trail.example.com
```

A tunnel, here a Cloudflare quick tunnel. Start it first, because it prints the host name:

```bash
cloudflared tunnel --url http://127.0.0.1:7421
npx teamtrail@next mcp --http --allow-host <name>.trycloudflare.com
```

Agents then connect to `https://<name>.trycloudflare.com/mcp`.

`ask_human` holds a request open while it waits for you, up to 10 minutes by default, so don't give the proxy a short timeout.

`--host` binds another IP address without a proxy. Use it only on a network you trust: the token crosses it unencrypted.

### The Host and Origin rule

Every request is checked before anything else is looked at:

- Its `Host` must be `localhost`, an IP address or a name you passed with `--allow-host`. Anything else gets a 403, `Host not allowed`.
- If it has an `Origin` (it comes from a web page), that must be the endpoint's own origin. Anything else gets a 403, `Origin not allowed`.

This is what stops a web page in someone's browser from reaching the endpoint. The Lookout's API follows the same rule, with no names to allow.

### Never share the Lookout's port

The Lookout (port `7420`) is for you, not for agents. Its API needs a [paired browser](/docs/sign-in/), never a token, and it protects itself further:

- Its own `/mcp` answers this machine only.
- It refuses a `Host` that isn't `localhost` or an IP address, so a proxy's or tunnel's host name gets a 403.
- The settings that change what runs on your machine or whom it trusts, tokens included, can only be changed from this machine.

Share only the `mcp --http` port.

### What a token grants

A token opens the agent tools at `/mcp` for this repo's trails, and nothing else:

- It can do what the [MCP tools](/docs/mcp-tools/) do: read trails, tickets and knowledge, claim and add tickets, ask you questions, record decisions the [risk policy](/docs/policy-json/) leaves to agents, and complete work.
- It can't open the Lookout or its API, create or revoke tokens, or see your other projects.
- It can't speak for you: see [What changes for a remote agent](#what-changes-for-a-remote-agent).
- It holds at most 8 sessions at a time.

With [GitHub Issues or Linear](/docs/trackers/) as the tracker, what a remote agent writes (tickets, comments, closing) goes to the tracker with your credentials, as it does for local agents.

### How far to trust a remote agent

The risk policy sees only what an agent declares. A decision is held for you when the agent names a high-risk category or files your path rules cover. An agent that declares nothing isn't caught.

So give an agent you don't fully trust only trails with [verification](/docs/verification/) on. There, every piece of work it finishes comes to you to review.

## What changes for a remote agent

A remote agent's files aren't on your machine, and nobody may be sitting at it. So:

|                                                                  | Local agent                                                                                                         | Remote agent                                                                                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worktree                                                         | One per claim, when [workspaces](/docs/parallel-work/) are on.                                                      | None. It works on a branch in its own checkout and pushes it.                                                                                                         |
| Finished work on a trail with verification                       | The checks run and git evidence is read.                                                                            | No check runs and no git evidence is read. The ticket comes to you as blocked: review its branch or pull request and approve, or pull the work and re-run the checks. |
| Answering as you                                                 | `answer_question` passes on what you said in the chat. It guides agents, but never passes a gate.                   | No `answer_question`. You answer in the Lookout or Slack.                                                                                                             |
| Skipping discovery                                               | `start_trail` with `discovery: false` asks you: a request you approve in the Lookout, or decline there or in Slack. | Refused. A trail it starts always begins with discovery.                                                                                                              |
| The trail's mode and destination                                 | `update_trail` asks you: a request you approve in the Lookout, or decline there or in Slack.                        | Refused. You switch the mode in the Lookout; it proposes a new destination with `propose_reroute`.                                                                    |
| A ticket that's yours to decide (junction, prototype, HITL task) | Closes only after you answered a question the agent asked on that ticket, in the Lookout or Slack.                  | The same.                                                                                                                                                             |
| Usage                                                            | Claude Code and Codex: read from the agent's own logs (`LOG`).                                                      | Self-reported through `report_progress` (`SELF`).                                                                                                                     |
| Your other projects                                              | `projects_status` shows them.                                                                                       | Refused. The connection is for this repo only.                                                                                                                        |

Two rules hold for every agent, local ones too:

- **"The human decided" needs your real answer.** A decision is recorded as yours only when it rests on your answer, given in the Lookout or Slack (in the Lookout, for a high-risk call), to a specific question the agent asked with `ask_human`. One answer backs one decision. See [MCP tools](/docs/mcp-tools/#decisions-the-human-made) and [Your decisions](/docs/security/#your-decisions).
- **Single-line inputs stay on one line.** Titles, names, ids and paths are refused when they hold a line break or another control character. Free text such as a ticket body, a question or a resolution may span lines.

## Per client

### Claude Code

`connect claude --url` runs `claude mcp add --transport http teamtrail <url>` with the token in an `Authorization` header. Claude Code keeps the header in its own config (`~/.claude.json`), for this project only, so `connect` needs the token when you run it.

- **Already connected over stdio?** `connect` says `"teamtrail" is already registered`. Run `claude mcp remove teamtrail`, then connect again.
- **New token?** Do the same: remove, then connect again with the new one.
- **No usage hook.** The `SessionStart` hook only works next to the server, so usage is what the agent reports.

### Codex

`connect codex --url` runs `codex mcp add teamtrail --url <url> --bearer-token-env-var TEAMTRAIL_TOKEN` and prints the config, to add by hand to `~/.codex/config.toml` if it couldn't:

```toml
[mcp_servers.teamtrail]
url = "https://trail.example.com/mcp"
bearer_token_env_var = "TEAMTRAIL_TOKEN"
tool_timeout_sec = 900
```

Codex stores only the variable's name. It reads `$TEAMTRAIL_TOKEN` each time it starts, so export the token in the shell that starts Codex. The token is never written to disk.

To switch an existing stdio registration, replace its `[mcp_servers.teamtrail]` block with this one.

### Other MCP clients

Any client that speaks streamable HTTP works. Give it the endpoint's URL and the header `Authorization: Bearer <token>`.

## On a headless server

Tokens are created in the Lookout, and only from the machine it runs on. On a server with no browser, start the Lookout there without opening one, and reach it through an SSH port-forward that keeps the same port on both ends:

```bash
teamtrail --no-open                             # on the server, in the repo
ssh -L 7420:127.0.0.1:7420 you@server           # on your laptop
```

Then open the **Sign in** link the server printed in its terminal (`http://127.0.0.1:7420/#pair=…`) in your laptop's browser, and click **Sign in this browser**. To the Lookout the connection comes from the server itself, so **Settings → Project → Remote agents** works as usual. If the link expired, run `teamtrail pair` on the server for a new one.

## Limits

|                     |                                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sessions per token  | 8. One more closes that token's longest-idle session. When all 8 are in the middle of a call, the new one is refused.                              |
| Sessions per server | 200.                                                                                                                                               |
| Idle sessions       | Closed after 60 minutes without a call. A call that is waiting on you counts as a call.                                                            |
| Tokens per project  | 50, with names of up to 60 characters.                                                                                                             |
| Single-line inputs  | 500 characters.                                                                                                                                    |
| Free text           | 50,000 characters.                                                                                                                                 |
| Lists               | 500 items.                                                                                                                                         |
| Connections         | 256 at a time. A request's headers must arrive within 10 seconds and the whole request within 30. Waits on a tool's answer aren't limited by this. |

The input limits apply to every agent, local ones too.

When a session ends, the ticket it held returns to the queue once its [lease](/docs/connect-your-agent/#other-mcp-clients) runs out.

## Troubleshooting

By what you see:

| You see                                                                       | What it means                                                                                                                                |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 401 `Unauthorized`                                                            | No token was sent, it's wrong or revoked, or no token exists yet. With Codex: `TEAMTRAIL_TOKEN` isn't exported in the shell that started it. |
| 403 `Host not allowed`                                                        | The agent reached the endpoint by a host name it doesn't know. Restart `mcp --http` with `--allow-host <that name>`.                         |
| 403 `Origin not allowed`                                                      | The request came from a web page on another origin. Connect from the agent's MCP client.                                                     |
| 403 `This endpoint answers this machine only`                                 | The URL points at the Lookout's port. Point it at `teamtrail mcp --http`.                                                                    |
| 404 `Session not found`                                                       | The session ended: it was idle, the server restarted, or the token opened a ninth session. Reconnect the agent.                              |
| 404 `Not found. The MCP endpoint is /mcp.`                                    | The URL's path is wrong. It ends in `/mcp`.                                                                                                  |
| 503 `This token already has 8 sessions at work`                               | All of the token's sessions are in the middle of a call. Give each agent its own token.                                                      |
| `must be a single line`                                                       | A tool call put a line break in a title, name, id or path. The agent sends it again on one line.                                             |
| `is too long (… characters; at most 500)`                                     | An input is over its limit. See [Limits](#limits).                                                                                           |
| `not available over a remote connection`                                      | The agent tried to speak for you: `answer_question`, `discovery: false`, or `mode` or `destination` on `update_trail`.                       |
| `is the human's to decide`                                                    | The agent tried to close a ticket that's yours to decide before you answered. Answer its question in the Lookout or Slack.                   |
| `connect`: `not checked: that would send the token unencrypted`               | The URL is plain HTTP to another machine. Use `https`, or pass `--allow-http`. The agent is set up either way.                               |
| `connect`: `reachable, but it refused the token`                              | Check the token in **Settings → Project → Remote agents**; it may be revoked or pasted wrong.                                                |
| `connect`: `not reachable from here right now`                                | The config is written anyway. Check the URL, and that `mcp --http` and the proxy or tunnel are running.                                      |
| `connect`: `answered, but not like a Teamtrail MCP endpoint`                  | Check the URL: it ends in `/mcp`. A 403 from the Host rule also shows up this way.                                                           |
| `that is not a Teamtrail token (they start with tt_)`                         | Something else was pasted as the token.                                                                                                      |
| Settings says tokens are created and revoked on the machine Teamtrail runs on | You opened the Lookout from another device. Open it on that machine, or through an [SSH port-forward](#on-a-headless-server).                |

## Next

- Every flag: [CLI commands](/docs/cli/).
- What agents can call: [MCP tools](/docs/mcp-tools/).
- Agents on your own machine: [Connect your agent](/docs/connect-your-agent/).
