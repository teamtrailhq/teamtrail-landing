# Introduction

Teamtrail is a local trail map for big work done by AI coding agents: you describe a trail, your agents map and do the work, and you make the calls that matter.

## How it works

1. You describe a trail, usually from your agent's chat with `/scout new "<idea>"`.
2. The agent frames it with you, studies the repo, and charts a **trail map**: a set of decision tickets wired with blocking edges.
3. Agents claim tickets over [MCP](/docs/mcp-tools/), ask you questions, record decisions with evidence, and prove their work against the checks and criteria you agreed on.
4. You steer in the **Lookout**, a web app that `teamtrail` serves on your machine, or straight from the chat with [`/scout`](/docs/scout-commands/).

## What matters for developers

- **Local-first.** Trails are plain files in your repo's [`.teamtrail/` folder](/docs/teamtrail-folder/), or issues in your [GitHub or Linear tracker](/docs/trackers/). There is no Teamtrail server.
- **Agent-agnostic.** Everything goes through MCP tools. Claude Code and Codex are the primary agents, and any MCP client works.
- **No model calls.** Teamtrail never calls a model. Agents write briefs, knowledge and criteria; Teamtrail gives them structure and enforces the gates in code.
- **Deterministic.** Lifecycle, gates, ranking and selection are code, not prompts. The same inputs give the same result, and every automated choice comes with a reason.
- **You decide.** Teamtrail never answers a question or approves anything on your behalf. Agents may make small calls themselves when your [risk policy](/docs/policy-json/) allows it, and every one is recorded for you to review.
- **Not an executor.** The local product doesn't start or schedule agents. It can prepare [git worktrees](/docs/parallel-work/) for agents that ask.

## Where to go next

| If you want to              | Read                                                                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install and run it          | [Install](/docs/install/), [Connect your agent](/docs/connect-your-agent/), [Your first trail](/docs/first-trail/)                                                   |
| Understand the model        | [Trails and tickets](/docs/trails-and-tickets/), [The .teamtrail folder](/docs/teamtrail-folder/)                                                                    |
| Shape how agents work       | [Guides](/docs/guides/), [Model matching](/docs/model-matching/), [Parallel work](/docs/parallel-work/)                                                              |
| Supervise several repos     | [All projects](/docs/all-projects/)                                                                                                                                  |
| Configure it without the UI | [verification.json](/docs/verification-json/), [policy.json](/docs/policy-json/), [attention.json](/docs/attention-json/), [workspaces.json](/docs/workspaces-json/) |
| Look something up           | [CLI commands](/docs/cli/), [MCP tools](/docs/mcp-tools/), [File formats](/docs/file-formats/), [Environment variables](/docs/environment-variables/)                |
