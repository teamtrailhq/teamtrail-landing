# Environment variables

Environment variables Teamtrail reads, for running it without the UI or in scripts.

## Teamtrail

| Variable                        | Default               |                                                                                                                                           |
| ------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `TEAMTRAIL_DIR`                 | `./.teamtrail`        | The tracker folder, like `--dir`.                                                                                                         |
| `TEAMTRAIL_CONFIG_DIR`          | `~/.config/teamtrail` | Your config folder (tokens, personal settings, the projects list). See [Personal settings](/docs/personal-settings/).                     |
| `TEAMTRAIL_LEASE_MINUTES`       | `15`                  | How long a claim lasts without a tool call from its agent, like `--lease-minutes`.                                                        |
| `TEAMTRAIL_INTEGRATION_POLL_MS` | `10000`               | How often the [integration check](/docs/parallel-work/) compares branches.                                                                |
| `TEAMTRAIL_NO_REGISTER`         |                       | Any value but `0` keeps `mcp` and `connect` from adding their repo to [All projects](/docs/all-projects/), like `--no-register`.          |
| `TEAMTRAIL_TOKEN`               |                       | A [remote agent](/docs/remote-agents/)'s token, on the agent's machine. `connect --url` reads it, and Codex reads it each time it starts. |
| `TEAMTRAIL_SLACK_APP_TOKEN`     |                       | Slack app-level token (`xapp-…`), when none is saved.                                                                                     |
| `TEAMTRAIL_SLACK_BOT_TOKEN`     |                       | Slack bot token (`xoxb-…`), when none is saved.                                                                                           |

## Trackers

| Variable                   |                                                                                                                                                                         |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`, `GH_TOKEN` | GitHub token, when none is pasted in Settings. They come before a [GitHub sign-in](/docs/trackers/#sign-in-with-github); without any of them, `gh auth token` is tried. |
| `LINEAR_API_KEY`           | Linear API key, when none is saved.                                                                                                                                     |

## Agents and usage

| Variable                     |                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE_CONFIG_DIR`          | Where Claude Code keeps its config and transcripts (default `~/.claude`).                                                           |
| `CODEX_HOME`                 | Where Codex keeps its config, prompts and session logs (default `~/.codex`). `connect codex` forwards a custom value to the server. |
| `XDG_CONFIG_HOME`, `APPDATA` | Base of the config folder on Linux/macOS and Windows.                                                                               |

## Testing and development

`TEAMTRAIL_GITHUB_API`, `TEAMTRAIL_LINEAR_API` and `TEAMTRAIL_SLACK_API` point the GitHub, Linear and Slack clients at another API base URL. `TEAMTRAIL_NO_GH_CLI` keeps Teamtrail from asking the `gh` CLI for its token. They're used by the test suites and aren't needed in normal use.
