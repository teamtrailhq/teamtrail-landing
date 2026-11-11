---
title: Install Teamtrail from npm · Teamtrail docs
description: Install the teamtrail command with npm (Node.js 20 or newer), and open the Lookout for a repo.
---

# Install

Install the `teamtrail` command and open the Lookout for a repo.

## Requirements

- Node.js 20 or newer. Teamtrail has no other runtime dependencies.
- Git, for workspaces and git evidence. Teamtrail still runs in a folder without git.

## Run it

```bash
npm i -g teamtrail@next   # or, without installing: npx teamtrail@next
cd your-repo
teamtrail
```

`teamtrail` starts a local server at `http://127.0.0.1:7420/`, opens your browser on the Lookout's sign-in page (one click signs in) and keeps trails as plain files in `./.teamtrail/` in the current folder. For another browser, it prints a one-time **Sign in** link in the terminal: see [Sign in to the Lookout](/docs/sign-in/). Agents and people can edit those files directly, and changes show up live. The same Lookout can show your other repos too: see [All projects](/docs/all-projects/).

> Until launch, the real CLI is published under the `next` tag. `teamtrail@latest` is a placeholder that only prints a short message.

## Options

| Option            | Default                              |                                                                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dir <path>`    | `./.teamtrail` (or `$TEAMTRAIL_DIR`) | The tracker folder.                                                                                                                                                                                                                                                         |
| `--port <n>`      | `7420`, or the next free port        | Port for the Lookout and its API. With the flag, a taken port is an error.                                                                                                                                                                                                  |
| `--host <addr>`   | `127.0.0.1`                          | IP address to bind, never a host name. `0.0.0.0` (or `::`) means each of the machine's network addresses. Other devices still need to be paired, and the connection is plain HTTP, so only use it on networks you trust: see [Other devices](/docs/sign-in/#other-devices). |
| `--no-open`       |                                      | Don't open the browser.                                                                                                                                                                                                                                                     |
| `-v`, `--version` |                                      | Print the version.                                                                                                                                                                                                                                                          |
| `-h`, `--help`    |                                      | Show the help.                                                                                                                                                                                                                                                              |

See [CLI commands](/docs/cli/) for every command.

## Updating

- With `npx teamtrail@next`, you always get the current `next` version. npx caches package metadata for a few minutes, so a release can take a moment to show up.
- With a global install, run `npm i -g teamtrail@next` again. There's no need to uninstall first.

## Commit `.teamtrail/` or not

Commit the shared files (trails, decisions, briefs, criteria, knowledge and the config files) so your team and your agents see the same state. Local-only folders such as the journal, evidence and agent coordination come with their own `.gitignore`. See [The .teamtrail folder](/docs/teamtrail-folder/) for which is which.
