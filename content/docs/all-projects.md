# All projects

Supervise every repo you work in from one Lookout: one list of what needs you across them, what changed while you were away, and a switch between projects in the header.

Each repo keeps its own `.teamtrail/` folder and its own agents. Agents only ever work in their own repo; the Lookout reads the others' files on your machine. Nothing leaves your machine.

## Adding projects

A project is a repo's tracker folder. The list of projects lives in `projects.json` in your [config folder](/docs/personal-settings/) (for example `~/.config/teamtrail/projects.json`), never in a repo.

- **Agents add their repo.** `teamtrail mcp` and `teamtrail connect claude|codex` register the repo they run in when they start. Opt one agent out with `--no-register` or by setting `TEAMTRAIL_NO_REGISTER` (any value but `0`). Turn it off for everyone in **Settings → Projects** (**Agents add their repo when they connect**).
- **Add one yourself.** `teamtrail projects add [path]` (default: this repo), or **Add project** in All projects or **Settings → Projects**.

```bash
teamtrail projects add ../billing-service
teamtrail projects list
teamtrail projects remove ../billing-service
```

A path can be the repo or its tracker folder. The repo must exist; its `.teamtrail/` folder is created if missing. `remove` takes the id or the path and only forgets the project: its files are untouched. See [CLI commands](/docs/cli/#teamtrail-projects).

The repo the Lookout was started in is always listed first, registered or not.

## The All projects view

With more than one project, the repo name in the header becomes a menu: **All projects**, then each project with how many items need you there. A badge on the name counts what interrupts in your other projects.

All projects has three parts:

| Part                | What it shows                                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Needs you           | One list across projects, ranked by the same scores each project's [Waiting on you](/docs/waiting-on-you/) uses. Answer an agent's question right there; the agent in that repo gets the answer. Open any other item to go to it in its project. |
| Projects            | One row per project: what needs you, agents running, tickets working, verifying, in rework or blocked, PR flags, stalled claims, and the top of its queue.                                                                                       |
| While you were away | What changed in each project since you last opened All projects (the last day, the first time): tickets done, new tickets, agent decisions, what's waiting on you.                                                                               |

Opening a project loads it in the same Lookout. A project another running `teamtrail` already serves shows as **other Lookout** and opens there in a new tab. A project whose folder is gone shows as **Missing** and can't be opened.

Projects on GitHub Issues or Linear show only the counts their local files give until you open them once.

## From the chat

`projects_status` is a read-only [MCP tool](/docs/mcp-tools/) that summarizes your other registered projects: agents running, questions waiting, what needs you, blocked work, stalled claims. Agents use it to tell you where else you're needed, and `/scout status` adds a line when another project has something waiting. An agent can't claim, close or change anything in another project.
