# GitHub Issues and Linear

Keep trails and tickets as issues in the tracker your team already uses, instead of markdown files.

## How it maps

The map and tickets keep the same body format as the markdown files. Teamtrail adds:

| Teamtrail                    | In the tracker                                                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Trail                        | An issue labelled `teamtrail:map`, with the map as its body.                                                                |
| Ticket type, HITL, plan-only | Labels: `teamtrail:research`, `teamtrail:junction`, …, `teamtrail:hitl`, `teamtrail:plan-only`.                             |
| Claim, phase, verification   | A `<!-- teamtrail:meta {…} -->` marker at the end of the issue body. A human assignee in the tracker counts as a claim too. |
| Decision record              | A comment on its ticket ending in a `<!-- teamtrail:decision {…} -->` marker.                                               |
| Comment author               | A `<!-- teamtrail:author <id> -->` first line (the API user posts every comment).                                           |

Writes go through a local outbox, so they survive going offline and replay once the tracker is reachable. The journal, evidence and agent coordination stay in the local [`.teamtrail/` folder](/docs/teamtrail-folder/).

## Connect

Open **Settings → Tracker** in the Lookout and pick GitHub or Linear. The choice is saved in `.teamtrail/trackers.json`, which holds no secrets:

```json
{
  "active": "github",
  "github": { "repo": "acme/fieldnote" }
}
```

```json
{
  "active": "linear",
  "linear": { "teamId": "…", "teamKey": "FN", "projectId": "…" }
}
```

`active` is `markdown` (the default), `github` or `linear`. For Linear, `projectId` is optional: trails are then created in that project and only its trails are listed.

## Tokens

Tokens never go in the repo. Teamtrail uses the first one it finds:

| Tracker | Order                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------- |
| GitHub  | Saved in Settings (`credentials.json`), then `$GITHUB_TOKEN`, then `$GH_TOKEN`, then `gh auth token`. |
| Linear  | Saved in Settings (`credentials.json`), then `$LINEAR_API_KEY`.                                       |

The repo defaults to the `origin` remote. Settings shows where a token came from, never its value.

GitHub is also where [verification](/docs/verification-json/) tracks pull requests and CI (`github` in `verification.json`).
