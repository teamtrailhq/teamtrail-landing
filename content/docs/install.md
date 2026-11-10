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

`teamtrail` starts a local server, opens the Lookout in your browser and keeps trails as plain files in `./.teamtrail/` in the current folder. Agents and people can edit those files directly, and changes show up live. The same Lookout can show your other repos too: see [All projects](/docs/all-projects/).

> Until launch, the real CLI is published under the `next` tag. `teamtrail@latest` is a placeholder that only prints a short message.

## Options

| Option            | Default                              |                                                                                                                                                                                                                                             |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dir <path>`    | `./.teamtrail` (or `$TEAMTRAIL_DIR`) | The tracker folder.                                                                                                                                                                                                                         |
| `--port <n>`      | `7420`, or the next free port        | Port for the Lookout and its API.                                                                                                                                                                                                           |
| `--host <addr>`   | `127.0.0.1`                          | Interface to bind. The Lookout has no sign-in, so only expose it on networks you trust, and never through a proxy or tunnel. From another device, open it by IP address: see [From another device](/docs/the-lookout/#from-another-device). |
| `--no-open`       |                                      | Don't open the browser.                                                                                                                                                                                                                     |
| `-v`, `--version` |                                      | Print the version.                                                                                                                                                                                                                          |
| `-h`, `--help`    |                                      | Show the help.                                                                                                                                                                                                                              |

See [CLI commands](/docs/cli/) for every command.

## Updating

- With `npx teamtrail@next`, you always get the current `next` version. npx caches package metadata for a few minutes, so a release can take a moment to show up.
- With a global install, run `npm i -g teamtrail@next` again. There's no need to uninstall first.

## Commit `.teamtrail/` or not

Commit the shared files (trails, decisions, briefs, criteria, knowledge and the config files) so your team and your agents see the same state. Local-only folders such as the journal, evidence and agent coordination come with their own `.gitignore`. See [The .teamtrail folder](/docs/teamtrail-folder/) for which is which.
