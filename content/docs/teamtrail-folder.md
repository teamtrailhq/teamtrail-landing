# The .teamtrail folder

Everything Teamtrail knows about a project lives in plain files in the repo's `.teamtrail/` folder.

Pass `--dir <path>` or set `$TEAMTRAIL_DIR` to use another folder. On GitHub Issues or Linear, trails and tickets live in the tracker instead, and the local folders below are still used for the journal, evidence and agent coordination.

## Layout

```text
.teamtrail/
├── <trail>/
│   ├── map.md                  trail frontmatter and the map body
│   ├── tickets/<n>.md          one file per ticket, with comments
│   └── decisions/D-<n>.md      decision records
├── briefs/<trail>.md         the discovery brief and its status
├── criteria/<trail>.md       acceptance criteria per ticket
├── knowledge/K-<n>.md          project and product knowledge
├── verification.json           checks run on completion
├── policy.json                 what always needs you
├── attention.json              how the ranked list interrupts you
├── workspaces.json             a git worktree per claim, on or off
├── trackers.json               which tracker the project uses (no secrets)
├── .events/<trail>.jsonl     the lifecycle journal
├── .evidence/                  verification attempts, check output, git evidence
├── .reroutes/<trail>/R-<n>.json  reroute proposals
├── .attention/state.json       your snoozes and dismissals
└── .agents/                    live coordination between processes
```

## Commit or keep local

| Path                                                                    | Commit?  | Why                                                                                          |
| ----------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `<trail>/`, `briefs/`, `criteria/`, `knowledge/`                        | Yes      | The shared state: teammates and agents see the same trails, decisions and knowledge.         |
| `verification.json`, `policy.json`, `attention.json`, `workspaces.json` | Yes      | Team settings. Checks come from the repo, so no agent can change what verifies its own work. |
| `trackers.json`                                                         | Optional | Names the tracker and repo or team; it never holds a token.                                  |
| `.events/`, `.evidence/`, `.reroutes/`, `.attention/`                   | No       | Local history and state. Each writes its own `.gitignore`.                                   |
| `.agents/`                                                              | No       | Sessions, answers, leases, trail names, workspaces and the server lock.                      |

Tokens and personal preferences never go in the repo: they live in your [config folder](/docs/personal-settings/).

## Editing by hand

Every file is meant to be readable and editable. The Lookout watches the folder and updates live when a file changes, whether an agent, a teammate's `git pull` or your editor changed it. Config files are validated on read; problems show in Settings, and the file's defaults apply until it's fixed.

See [File formats](/docs/file-formats/) for each file's format.
