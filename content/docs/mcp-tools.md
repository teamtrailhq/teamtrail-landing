---
title: MCP tools reference · Teamtrail docs
description: Every tool the teamtrail mcp server offers to Claude Code, Codex and other MCP agents, grouped by what agents use it for.
---

# MCP tools

Every tool the `teamtrail mcp` server offers, grouped by what agents use it for.

Agents also get server instructions on connect that explain when to use each tool. Most tools take an optional `trail` (key such as `#1`, id or title; default: the trail the session is on) and an optional `ticket` (default: the ticket the agent holds). Read-only tools are marked.

## Trails

| Tool           |                                                                                                                                                                              | Main inputs                                                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`       | Read-only. Trails, progress, ready / claimed / blocked tickets, sessions, the ranked attention summary, discovery, adaptive and parallel-work state, `modelMatching`, spend. | `trail`                                                                                                                                                                                                       |
| `start_trail`  | Create a trail and chart its tickets. Adds a discovery ticket unless `discovery: false`.                                                                                     | `title`, `destination`, `notes`, `mode`, `decided`, `unspecified`, `outOfScope`, `tickets[]` (`ref`, `title`, `type`, `body`, `hitl`, `blockedBy`, `guide`, `criteria`), `assumptions[]`, `team`, `discovery` |
| `resume_trail` | Open a session on a trail: status, any ticket you still hold, the next ready ticket, `modelMatching`.                                                                        | `trail`                                                                                                                                                                                                       |
| `update_trail` | Edit the destination or notes, add Not yet specified, Out of scope or Assumptions lines, switch mode. Plan changes go through `propose_reroute`.                             | `destination`, `notes`, `addUnspecified`, `addOutOfScope`, `addAssumptions`, `mode`                                                                                                                           |
| `submit_brief` | Submit the discovery brief for the human to review.                                                                                                                          | `summary`, `existing` (required), `productContext`, `conventions`, `dataModel`, `api`, `risks`, `assumptions`, `openQuestions`                                                                                |
| `get_brief`    | Read-only. The brief, its status and any requested changes.                                                                                                                  | `trail`                                                                                                                                                                                                       |

## Tickets

| Tool             |                                                                                                                                                                                                                                                                       | Main inputs                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `next_ticket`    | Read-only. The oldest ready ticket with its blockers' decisions. Doesn't claim. With model matching on, the best fit for your model; when nothing fits, `reason` says what waits for a stronger model.                                                                | `types`, `guides`                                                                    |
| `claim_ticket`   | Claim a ticket (default: the next ready one). Returns knowledge, suggested criteria, verification checks, the ticket's `guide`, any `warnings` and the `workspace`. Fails if another agent got it first, if it's frozen by a reroute, or if discovery isn't accepted. | `ticket`, `guides`, `touches` (path globs), `workspace`                              |
| `release_ticket` | Give a claimed ticket back without closing it.                                                                                                                                                                                                                        | `ticket`, `reason`                                                                   |
| `add_ticket`     | Add a ticket, or promote a Not yet specified line.                                                                                                                                                                                                                    | `title`, `type`, `body`, `hitl`, `blockedBy`, `fromUnspecified`, `criteria`, `guide` |
| `set_criteria`   | Set a ticket's acceptance criteria (`AC-1`, …), replacing existing ones.                                                                                                                                                                                              | `ticket`, `criteria[]` (`text`, `kind`, `source`)                                    |

### The `guides` filter

`claim_ticket` and `next_ticket` take `guides` (guide ids, up to 20) to pick only tickets whose guide is one of them; tickets without a guide are left out. Claiming a named ticket outside the filter is refused rather than swapped.

### What a claim returns

Besides `claimed`, `session`, `discovery`, `knowledge`, `criteria`, `git` and `lease`, a claim result can have:

| Field                                    | When                                                                                                                                                      |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claimed.guide`                          | The ticket has an active [guide](/docs/guides/): `id`, `name`, `version`, `instructions`, `checklist`, `requiredChecks`, `preferredAgent`.                |
| `claimed.guideWarning`                   | The ticket asks for a guide that can't be used now. Work it without guide instructions.                                                                   |
| `tier`                                   | The trail has [model matching](/docs/model-matching/) on: `{ session, ticket, model? }`, the session's tier, the ticket's and the model it was read from. |
| `tierNote`                               | You claimed by key a ticket set for a stronger tier than your session runs. Tell the human.                                                               |
| `workspace`, `workspaceNote`, `warnings` | See [Parallel work](/docs/parallel-work/).                                                                                                                |

`next_ticket` returns `ticket` (with `guide` or `guideWarning` the same way) and `tier`.

When the ticket's guide has a checklist, `close_ticket`, `report_completion` and `submit_review` need `checklist`: one `{ item, done, note? }` per item, by item text or number. A missing item refuses the completion.

## Working and completing

| Tool                  |                                                                                                                                         | Main inputs                                                                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `report_progress`     | Step, log line, chat message; tokens and cost only when no agent log is read.                                                           | `step`, `message`, `level`, `say`, `inputTokens`, `outputTokens`, `costUsd`                                                                                                                                                                                       |
| `close_ticket`        | Resolve or rule out a ticket: resolution comment, decision record, unblocked tickets. Runs verification first when the ticket needs it. | `resolution`, `summary`, `rationale`, `alternatives`, `outcome` (`completed` or `out_of_scope`), `criteria[]` (`id`, `evidence`, `note`), `checklist[]` (`item`, `done`, `note`), `category`, `paths`, `assumes`, `noCodeReason`, `postTranscript`, `waitSeconds` |
| `report_completion`   | Claim a ticket is done; like `close_ticket`, plus the pull request to track.                                                            | the same, plus `pr`                                                                                                                                                                                                                                               |
| `verification_status` | Read-only. Attempts, check results and verdicts; can wait for running checks.                                                           | `ticket`, `wait`, `waitSeconds`                                                                                                                                                                                                                                   |
| `submit_review`       | Answer a review ticket. You can't review work you did.                                                                                  | `ticket`, `verdict` (`PASS`, `FAIL`, `NEEDS_HUMAN`), `summary`, `findings[]` (`path`, `line`, `severity`, `text`), `checklist[]`                                                                                                                                  |
| `record_decision`     | Keep a decision that isn't a ticket resolution. High-risk calls are rejected unless the human made them.                                | `question`, `answer`, `summary`, `rationale`, `alternatives`, `decidedBy`, `appendToTrail`, `category`, `paths`, `assumes`                                                                                                                                        |

## The human

| Tool              |                                                                            | Main inputs                                                                                                                    |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `ask_human`       | Ask through Waiting on you and wait for the answer.                        | `question`, `suggestions`, `waitSeconds`, `framing`, `urgency` (`blocking`, `soon`, `fyi`), `blocks` (ticket refs), `category` |
| `wait_for_answer` | Read-only. Keep waiting for an answer.                                     | `questionId`, `waitSeconds`                                                                                                    |
| `list_inbox`      | Read-only. Waiting questions plus the ranked attention items with reasons. | `kinds`                                                                                                                        |
| `answer_question` | Pass on the human's own words from the chat. Never invent an answer.       | `questionId`, `answer`                                                                                                         |

## Guides and other projects

| Tool              |                                                                                                                                                                                                                                           | Main inputs |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `list_guides`     | Read-only. The active [guides](/docs/guides/) you can give tickets: id, name, version, summary, ticket types, checklist size, required checks. Unusable ones are listed by id and reason. Installing and approving guides is the human's. |             |
| `projects_status` | Read-only. The human's other registered repos (see [All projects](/docs/all-projects/)): agents running, questions waiting, what needs the human, blocked work, PR flags, stalled claims. You can't act in another project.               |             |

## Knowledge

| Tool                |                                                                     | Main inputs                                         |
| ------------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| `search_knowledge`  | Read-only. Search entries by words, paths and tags.                 | `query`, `paths`, `tags`, `kind`, `includeOutdated` |
| `propose_knowledge` | Suggest an entry; it stays `suggested` until the human confirms it. | `kind`, `title`, `body`, `scope`, `tags`, `files`   |
| `flag_knowledge`    | Report an entry that contradicts the code or product.               | `id` (`K-<n>`), `reason`                            |

## Assumptions and reroutes

| Tool                   |                                                                                                       | Main inputs                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `list_assumptions`     | Read-only. The trail's assumptions with status and linked tickets.                                    | `trail`                                                                                                            |
| `challenge_assumption` | Mark an assumption challenged, with evidence. Returns what depends on it.                             | `assumption` (`S-<n>`), `evidence`, `ticket`                                                                       |
| `propose_reroute`      | Propose typed plan changes. Returns errors, or the pending proposal with its diff and frozen tickets. | `kind` (`reroute`, `challenge-destination`), `destinationReason`, `reason`, `evidence`, `invalidates`, `changes[]` |
| `reroute_status`       | Read-only. A proposal's status; can wait for the human's decision.                                    | `id`, `wait`, `waitSeconds`                                                                                        |

See [Assumptions and reroutes](/docs/adaptive-trails/) for the change types, and [Verification and criteria](/docs/verification/) for completion results.
