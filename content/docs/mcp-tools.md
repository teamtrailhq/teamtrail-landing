---
title: MCP tools reference · Teamtrail docs
description: Every tool the teamtrail mcp server offers to Claude Code, Codex and other MCP agents, grouped by what agents use it for.
---

# MCP tools

Every tool the `teamtrail mcp` server offers, grouped by what agents use it for.

Agents also get server instructions on connect that explain when to use each tool. Most tools take an optional `trail` (key such as `#1`, id or title; default: the trail the session is on) and an optional `ticket` (default: the ticket the agent holds). Read-only tools are marked.

The same tools are served over stdio (`teamtrail mcp`) and over HTTP (`teamtrail mcp --http`). A few are held back from agents connected over HTTP: see [Over a remote connection](#over-a-remote-connection).

## Trails

| Tool           |                                                                                                                                                                                            | Main inputs                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`       | Read-only. Trails, progress, ready / claimed / blocked tickets, sessions, the ranked attention summary, discovery, adaptive and parallel-work state, `modelMatching`, spend.               | `trail`                                                                                                                                                                                                       |
| `start_trail`  | Create a trail and chart its tickets. Adds a discovery ticket unless `discovery: false` (local agents only).                                                                               | `title`, `destination`, `notes`, `mode`, `decided`, `unspecified`, `outOfScope`, `tickets[]` (`ref`, `title`, `type`, `body`, `hitl`, `blockedBy`, `guide`, `criteria`), `assumptions[]`, `team`, `discovery` |
| `resume_trail` | Open a session on a trail: status, any ticket you still hold, the next ready ticket, `modelMatching`.                                                                                      | `trail`                                                                                                                                                                                                       |
| `update_trail` | Edit the destination or notes, add Not yet specified, Out of scope or Assumptions lines, switch mode (destination and mode: local agents only). Plan changes go through `propose_reroute`. | `destination`, `notes`, `addUnspecified`, `addOutOfScope`, `addAssumptions`, `mode`                                                                                                                           |
| `submit_brief` | Submit the discovery brief for the human to review.                                                                                                                                        | `summary`, `existing` (required), `productContext`, `conventions`, `dataModel`, `api`, `risks`, `assumptions`, `openQuestions`                                                                                |
| `get_brief`    | Read-only. The brief, its status and any requested changes.                                                                                                                                | `trail`                                                                                                                                                                                                       |

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

| Field                                    | When                                                                                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claimed.guide`                          | The ticket has an active [guide](/docs/guides/): `id`, `name`, `version`, `instructions`, `checklist`, `requiredChecks`, `preferredAgent`.                      |
| `claimed.guideWarning`                   | The ticket asks for a guide that can't be used now. Work it without guide instructions.                                                                         |
| `tier`                                   | The trail has [model matching](/docs/model-matching/) on: `{ session, ticket, model? }`, the session's tier, the ticket's and the model it was read from.       |
| `tierNote`                               | You claimed by key a ticket set for a stronger tier than your session runs. Tell the human.                                                                     |
| `workspace`, `workspaceNote`, `warnings` | See [Parallel work](/docs/parallel-work/). A [remote agent](/docs/remote-agents/) gets no `workspace`, and a `workspaceNote` saying why when one was asked for. |

`next_ticket` returns `ticket` (with `guide` or `guideWarning` the same way) and `tier`.

When the ticket's guide has a checklist, `close_ticket`, `report_completion` and `submit_review` need `checklist`: one `{ item, done, note? }` per item, by item text or number. A missing item refuses the completion.

## Working and completing

| Tool                  |                                                                                                                                                          | Main inputs                                                                                                                                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `report_progress`     | Step, log line, chat message; tokens and cost only when no agent log is read.                                                                            | `step`, `message`, `level`, `say`, `inputTokens`, `outputTokens`, `costUsd`                                                                                                                                                                                                     |
| `close_ticket`        | Resolve or rule out a ticket: resolution comment, decision record, unblocked tickets. Runs verification first when the ticket needs it.                  | `resolution`, `summary`, `rationale`, `alternatives`, `outcome` (`completed` or `out_of_scope`), `criteria[]` (`id`, `evidence`, `note`), `checklist[]` (`item`, `done`, `note`), `questionId`, `category`, `paths`, `assumes`, `noCodeReason`, `postTranscript`, `waitSeconds` |
| `report_completion`   | Claim a ticket is done; like `close_ticket`, plus the pull request to track.                                                                             | the same, plus `pr`                                                                                                                                                                                                                                                             |
| `verification_status` | Read-only. Attempts, check results and verdicts; can wait for running checks.                                                                            | `ticket`, `wait`, `waitSeconds`                                                                                                                                                                                                                                                 |
| `submit_review`       | Answer a review ticket. You can't review work you did.                                                                                                   | `ticket`, `verdict` (`PASS`, `FAIL`, `NEEDS_HUMAN`), `summary`, `findings[]` (`path`, `line`, `severity`, `text`), `checklist[]`                                                                                                                                                |
| `record_decision`     | Keep a decision that isn't a ticket resolution. It's the agent's own unless `questionId` names your answer; high-risk calls are rejected unless it does. | `question`, `answer`, `summary`, `rationale`, `alternatives`, `questionId`, `appendToTrail`, `category`, `paths`, `assumes`                                                                                                                                                     |

### Decisions the human made

A decision is recorded as yours only when it rests on your answer to a question the agent asked. Nothing the agent passes can say so on its own.

- `ask_human` returns a `questionId`. Once you answer, that answer can back a decision.
- `record_decision` takes `questionId`. The record then keeps the question as asked and your answer word for word, with the agent's own wording as its reading of it. Without `questionId` the decision is recorded as the agent's.
- `close_ticket` and `report_completion` use your latest unused answer to a question asked on that ticket, or the one `questionId` names.
- **One answer, one decision.** An answer that already backs a decision is refused for a second one; the agent asks again.
- **An answer covers what was asked.** To close a ticket, the question must have been asked on that ticket. The decision's `category` must be the one the question was asked with. A high-risk decision, or a ticket that's yours to decide, also needs a question that wasn't asked as `fyi`.
- The question must be one the agent asked itself, on the connection it's still on.

`record_decision` no longer takes `decidedBy`: naming someone else there is refused.

## The human

| Tool              |                                                                                         | Main inputs                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `ask_human`       | Ask through Waiting on you and wait for the answer. Returns a `questionId`.             | `question`, `suggestions`, `waitSeconds`, `framing`, `urgency` (`blocking`, `soon`, `fyi`), `blocks` (ticket refs), `category` |
| `wait_for_answer` | Read-only. Keep waiting for an answer.                                                  | `questionId`, `waitSeconds`                                                                                                    |
| `list_inbox`      | Read-only. Waiting questions plus the ranked attention items with reasons.              | `kinds`                                                                                                                        |
| `answer_question` | Pass on the human's own words from the chat. Never invent an answer. Local agents only. | `questionId`, `answer`                                                                                                         |

## Guides and other projects

| Tool              |                                                                                                                                                                                                                                                | Main inputs |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `list_guides`     | Read-only. The active [guides](/docs/guides/) you can give tickets: id, name, version, summary, ticket types, checklist size, required checks. Unusable ones are listed by id and reason. Installing and approving guides is the human's.      |             |
| `projects_status` | Read-only. The human's other registered repos (see [All projects](/docs/all-projects/)): agents running, questions waiting, what needs the human, blocked work, PR flags, stalled claims. You can't act in another project. Local agents only. |             |

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

## Input limits

Every string a tool takes is a single line unless it's free text. Titles, names, ids, keys, criteria, list items and paths are refused when they hold a line break or another control character. Free text may span lines: bodies, questions, answers, resolutions, rationales, the brief's sections, review summaries and evidence.

|                     | At most           |
| ------------------- | ----------------- |
| A single-line input | 500 characters    |
| Free text           | 50,000 characters |
| A list              | 500 items         |

A call over a limit is refused before anything is written, and the error names the input.

## Over a remote connection

An agent connected over HTTP ([Remote agents](/docs/remote-agents/)) may be a sandbox with nobody at it, so it can never speak for you:

| Tool                                | Over HTTP                                                                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `answer_question`                   | Not listed, and refused if called. You answer in the Lookout or Slack.                                                            |
| `start_trail`                       | `discovery: false` is refused.                                                                                                    |
| `update_trail`                      | `mode` and `destination` are refused. A new destination goes through `propose_reroute` (`challenge-destination`).                 |
| `close_ticket`, `report_completion` | A ticket that's yours to decide (junction, prototype, HITL task) closes only after you answered a question the agent asked on it. |
| `projects_status`                   | Refused: the connection is for this repo only.                                                                                    |
| `claim_ticket`                      | No `workspace` is prepared, and `git` holds a note that this is a remote connection instead of the baseline.                      |
| `report_progress`                   | Usage is never read from a log on your machine; the numbers the agent reports count.                                              |

On a trail with [verification](/docs/verification/), a remote agent's completion runs no checks. It comes back `blocked` and waits for you.
