# File formats

The format of every file in `.teamtrail/`, with short examples from a real trail.

Markdown files use YAML-style frontmatter between `---` lines. Times are ISO 8601 in frontmatter and epoch milliseconds in JSON. See [The .teamtrail folder](/docs/teamtrail-folder/) for which files to commit.

## Trail: `<trail>/map.md`

```md
---
key: '#1'
title: Offline-first sync for Fieldnote
mode: plan+execute
labels: [teamtrail:map]
created: 2026-11-04T11:57:05.743Z
updated: 2026-11-04T11:57:05.792Z
---

## Destination

Fieldnote mobile users can capture and edit notes for a week with no signal.

## Notes

Current sync is request/response over REST.

## Assumptions

- [holding] Notes stay under 10,000 per device <!-- teamtrail:asm {"id":"S-1","tickets":["5","10"],"source":"brief:A-1"} -->

## Decisions so far

- #3: Field researchers with multi-day dead zones, not commuters.

## Not yet specified

- Attachments and photo sync

## Out of scope

- Real-time collaborative cursors — single-author notes
```

`mode` is `plan+execute` or `plan-only`. Optional keys:

| Key              |                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `verification`   | The trail's [verification level](/docs/verification/).                                      |
| `guides`         | The trail's team: the [guide](/docs/guides/) ids its tickets use, such as `[reviewer, qa]`. |
| `model-matching` | `on` or `off`: [model matching](/docs/model-matching/) for this trail.                      |
| `model-tiers`    | Tier per ticket type where it differs from the default, such as `[research=balanced]`.      |

The body format is the same on GitHub and Linear, where these settings travel with the trail issue.

### Assumption lines

```md
- [<status>] <text> <!-- teamtrail:asm {json} -->
```

The JSON holds `id` (`S-<n>`), `tickets` (ticket ids that depend on it), and optionally `source` (`brief:A-<n>`), `challenge` (`by`, `at`, `evidence`, `ticketId`) and `decidedBy` (`R-<n>` or `trail lead`). Statuses: `holding`, `challenged`, `invalidated`, `confirmed`.

## Ticket: `<trail>/tickets/<n>.md`

```md
---
id: '3'
title: Who is the primary offline user?
type: junction
labels: [teamtrail:junction]
state: closed
close_reason: completed
assignee: ''
blocked_by: []
created: 2026-11-04T11:57:05.746Z
updated: 2026-11-04T11:57:05.758Z
closed: 2026-11-04T11:57:05.758Z
---

Decision ticket for the Fieldnote offline sync trail.

## Comments

### claude-07 @ 2026-11-04T11:57:05.757Z

**Resolution**

Field researchers with multi-day dead zones, not commuters.
```

| Key                      |                                                                   |
| ------------------------ | ----------------------------------------------------------------- |
| `type`                   | `research`, `prototype`, `junction`, `task`, `execute`, `review`. |
| `labels`                 | `teamtrail:<type>`, plus `teamtrail:hitl` for HITL tasks.         |
| `state`, `close_reason`  | `open` / `closed`; `completed` or `out_of_scope` when closed.     |
| `assignee`               | The agent or person holding the claim.                            |
| `blocked_by`             | Ticket ids that must close first.                                 |
| `status`                 | Optional: `verifying`, `rework` or `blocked`.                     |
| `verification`, `checks` | Optional per-ticket overrides of the level and the checks to run. |
| `review_of`              | On `review` tickets: the ticket under review.                     |
| `guide`                  | Optional: the [guide](/docs/guides/) the claiming agent takes on. |

## Decision: `<trail>/decisions/D-<n>.md`

```md
---
id: D-3
trail: offline-first-sync-for-fieldnote
ticket: '3'
ticket_key: '#3'
decided_by: arekom
decided_at: 2026-11-03T23:27:05.743Z
participants: [arekom, trail lead]
source: tracker
supersedes: D-2
---

## Question

Who is the primary offline user?

## Decision

Field researchers with multi-day dead zones, not commuters.

## Summary

## Alternatives

- Commuters with patchy transit signal

## Rationale

## Transcript
```

Decisions can also carry the risk level they got from the [policy](/docs/policy-json/) and the assumptions they rely on.

## Discovery brief: `briefs/<trail>.md`

```md
---
status: accepted
author: claude-01
submitted: 2026-11-02T11:57:05.772Z
decided: 2026-11-02T12:57:05.772Z
---

## Summary

## Product context

## Existing implementation

## Conventions and abstractions

## Data model impact

## API impact

## Risks and possible regressions

## Assumptions

- A-1: Notes stay under 10,000 per device

## Open questions
```

`status` is `draft`, `submitted`, `accepted` or `changes-requested` (with your `note`).

## Acceptance criteria: `criteria/<trail>.md`

```md
# Acceptance criteria: Offline-first sync for Fieldnote

## #8 (id 8) · confirmed

- AC-1 (unit) Every sync failure is counted with its cause
- AC-2 (business-rule, K-1) Counting never drops or changes a user's edit
- AC-3 (manual) The dashboard shows last week's failure rate
```

One section per ticket; `· confirmed` once you confirmed them. Each line is `AC-<n> (<kind>[, <knowledge id>]) <text>`.

## Knowledge: `knowledge/K-<n>.md`

```md
---
title: Never lose a field edit
kind: business-rule
status: confirmed
scope: [src/sync/**]
tags: [sync, merge]
sources: [trail:#1]
anchors: [src/sync/merge.ts@3f2a1c9]
createdBy: claude-01
created: 2026-11-01T11:57:05.772Z
updated: 2026-11-02T11:57:05.772Z
---

A user's edit must survive any sync conflict.
```

`anchors` are `path@blobhash`, used for [staleness](/docs/discovery-and-knowledge/). A flagged entry also has `flaggedBy`, `flagged` and `flagReason`.

## Guide: `guides/<id>.md`

YAML frontmatter with the guide's fields, then its instructions as markdown. See [Guides](/docs/guides/#the-file-format) for every field and the lint.

## Guide lock: `guides.lock.json`

Written by Teamtrail when you add, update or approve a guide or one of its checks. Committed.

```json
{
  "v": 1,
  "guides": {
    "a11y": {
      "version": "1.0.0",
      "sha256": "sha256:4eed4d842c1e482ff0ae10209492d7f576f9f2ca2b975686fac0c90e0da43429",
      "source": {
        "registry": "https://raw.githubusercontent.com/teamtrailhq/teamtrail-guides/main",
        "path": "guides/a11y.md",
        "commit": "9138782f4e6e38068cfa8caed0b68f824691be96"
      },
      "addedAt": "2026-11-08T12:00:00.000Z",
      "addedBy": "trail lead",
      "approvedChecks": { "a11y": "sha256:…" },
      "requiresChecks": ["a11y"]
    }
  }
}
```

| Key                  |                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `version`            | The approved version.                                                                                                 |
| `sha256`             | `sha256:<hex>` of the exact guide file you approved. A file that no longer matches is switched off.                   |
| `source`             | `"local"`, or `{ registry, path, commit? }` for a catalog guide.                                                      |
| `addedAt`, `addedBy` | When and by whom.                                                                                                     |
| `approvedChecks`     | Proposed checks you approved: name to the hash of their `run`, `cwd` and `timeoutSec`. A change needs approval again. |
| `requiresChecks`     | The approved version's required checks. They still apply if the file is edited after approval.                        |

Teamtrail also keeps the lock as you last approved it in `.agents/guides-approved.json` (local). An entry of `guides.lock.json` that differs from it, changed by an agent or pulled with git, switches its guide off until you approve it again.

## Guide catalogs: `guides.json`

```json
{
  "v": 1,
  "registries": [{ "name": "teamtrail", "url": "https://raw.githubusercontent.com/teamtrailhq/teamtrail-guides/main" }]
}
```

Optional; committed. The catalogs to search, in order, each with a `name` and an `https` URL. Missing, or with no valid registry, means the official catalog. See [Guides](/docs/guides/#other-catalogs).

## Checklist answers: `.evidence/<trail>/<ticket>/checklist.json`

The latest answers to a ticket's guide checklist: `guide` (`id`, `version`), `answers` (`item`, `done`, `note`), `by` and `at`. Local.

## Models: `models.json`

```json
{ "v": 1, "models": { "my-finetune-v2": "strongest", "local-llama-*": "fast" } }
```

Optional; committed. Model ids or globs to `fast`, `balanced` or `strongest`, read before the built-in table. Unknown keys and tiers are errors. See [Model matching](/docs/model-matching/#modelsjson).

## Reroute proposal: `.reroutes/<trail>/R-<n>.json`

```json
{
  "v": 1,
  "id": "R-1",
  "mapId": "team-workspaces",
  "kind": "challenge-destination",
  "destinationReason": "already-exists",
  "by": "claude-02",
  "at": 1793792225772,
  "reason": "Organizations already give teams shared notebooks and an admin role.",
  "evidence": "`src/admin/orgs.ts` has organizations with members and an admin role since v3.2.",
  "invalidates": [],
  "changes": [
    { "op": "update_destination", "text": "Admins manage their organization's members themselves." },
    { "op": "cancel_ticket", "ticket": "18", "reason": "Organizations are the prior art" }
  ],
  "status": "pending",
  "applied": [],
  "created": {}
}
```

`status` is `pending`, `approved`, `rejected` or `superseded`. `applied` lists the indexes of changes already executed, so applying resumes where it stopped. See [Assumptions and reroutes](/docs/adaptive-trails/) for every change `op`.

## Journal: `.events/<trail>.jsonl`

One JSON object per line, append-only. Transitions (`kind: "transition"`: `event`, `from`, `to`, `actor`, `actorKind`, `reason`; `event: "reopen"` only comes from an approved reroute) and reroute steps:

```json
{
  "v": 1,
  "kind": "reroute",
  "at": 1793793425803,
  "mapId": "offline-first-sync-for-fieldnote",
  "rerouteId": "R-1",
  "action": "proposed",
  "actor": "claude-02",
  "actorKind": "agent",
  "reason": "The notes API cannot take batches."
}
```

Readers skip kinds they don't know, so old and new journals both load.

## Local coordination: `.agents/`

Written by Teamtrail processes, not meant for hand edits: agent sessions, answers, ticket leases (with declared `touches` and the `workspace`), trail names, prepared workspaces (`workspaces/`), the latest integration scan (`integration.json`), the guide lock as you last approved it (`guides-approved.json`) and the server lock.

## Projects registry: `projects.json` (config folder)

Not in the repo: it lives in your [config folder](/docs/personal-settings/), and lists the repos [All projects](/docs/all-projects/) shows.

```json
{
  "v": 1,
  "projects": [
    {
      "id": "3f2a1c9e4b",
      "name": "billing-service",
      "path": "/Users/you/code/billing-service",
      "root": "/Users/you/code/billing-service/.teamtrail",
      "addedAt": 1793792225772
    }
  ],
  "autoRegister": true
}
```

`id` is a short hash of the tracker folder's real path. `autoRegister: false` stops `teamtrail mcp` and `connect` from adding their repo. Broken entries are dropped on read; use `teamtrail projects` or **Settings → Projects** to change it.
