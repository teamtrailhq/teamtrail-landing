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

The first time you open the Lookout it asks **Where should your trails live?**: local files, GitHub Issues or Linear. Later, change it in **Settings → Project → Tracker**.

Nothing connects until you press **Connect**:

- **GitHub** shows the account it will use ("Will use acme/fieldnote as octocat (your gh login)") and a searchable picker of your repos, starting on the `origin` remote. Without a token: **Sign in with GitHub** (below), paste a token and type the repo, or run `gh auth login` in a terminal and the Lookout finds it in a few seconds. **Use another token** switches to pasting one.
- **Linear** shows whose API key it is, a searchable picker of your teams and, optionally, a project. Without a key in `$LINEAR_API_KEY`, paste one first.

While it looks up your account, repos, teams or projects, the picker shows placeholder rows and a quiet line instead of an empty list, and **Connect** waits until they arrive. A lookup that fails says why, with **Retry**.

The choice is saved in `.teamtrail/trackers.json`, which holds no secrets:

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

## Sign in with GitHub

No `gh` login or token needed. In the GitHub setup, **Sign in with GitHub** shows a code. **Open GitHub** takes you to github.com to enter it, and once you approve, the picker shows your repos as you.

The sign-in uses GitHub's device flow with Teamtrail's GitHub OAuth app and the `repo` scope, straight from your machine; nothing goes through a Teamtrail server. The token is kept in `credentials.json` in your [config folder](/docs/personal-settings/) (mode `0600`), never in the repo. Signing in replaces a token you pasted before.

**Sign out** forgets the token on this machine. GitHub keeps the grant until you revoke it there (**Settings → Applications → Authorized OAuth Apps**).

With `$GITHUB_TOKEN` or `$GH_TOKEN` set, that token wins, so the Lookout doesn't offer to sign in.

## Tokens

Tokens never go in the repo. Teamtrail uses the first one it finds:

| Tracker | Order                                                                                                                                                          |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub  | A token pasted in Settings (`credentials.json`), then `$GITHUB_TOKEN`, then `$GH_TOKEN`, then your sign-in from **Sign in with GitHub**, then `gh auth token`. |
| Linear  | Saved in Settings (`credentials.json`), then `$LINEAR_API_KEY`.                                                                                                |

The repo defaults to the `origin` remote. Settings shows where a token came from, never its value.

GitHub is also where [verification](/docs/verification-json/) tracks pull requests and CI (`github` in `verification.json`).
