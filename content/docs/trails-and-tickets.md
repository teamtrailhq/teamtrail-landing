# Trails and tickets

A trail is a map of decision tickets with blocking edges; agents work the ready ones and you make the calls that need you.

## The trail map

Every trail has a **destination** (what done looks like) and these sections, stored in the trail's `map.md`:

| Section           | What it holds                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Destination       | One or two sentences: what done looks like.                                                               |
| Notes             | Context worth keeping.                                                                                    |
| Assumptions       | What the plan relies on and could turn out wrong. See [Assumptions and reroutes](/docs/adaptive-trails/). |
| Decisions so far  | One line per decision, added as tickets close.                                                            |
| Not yet specified | Known unknowns. A line can be promoted to a ticket later.                                                 |
| Out of scope      | What the trail won't do, with the reason.                                                                 |

A trail runs in one of two modes: `plan+execute` (default) or `plan-only`, which disables `execute` tickets.

## Ticket types

| Type        | Used for                                                                 | Needs you?  |
| ----------- | ------------------------------------------------------------------------ | ----------- |
| `research`  | Things an agent can find out alone.                                      | No          |
| `junction`  | Decisions only you can make. The agent asks, you answer.                 | Yes         |
| `prototype` | Something to try before deciding. You judge the result.                  | Yes         |
| `task`      | Checks and chores. `hitl: true` when you must do or approve it.          | When `hitl` |
| `execute`   | Implementation, once its decisions are made.                             | When `hitl` |
| `review`    | An independent review of another ticket's work, created by verification. | No          |

`blockedBy` wires tickets together: a ticket is ready only when everything it's blocked by is closed.

## Ticket phases

| Phase       | Meaning                                                                            |
| ----------- | ---------------------------------------------------------------------------------- |
| `backlog`   | Waiting on blockers, or parked on a `plan-only` trail.                             |
| `ready`     | Nothing blocks it; any agent can claim it.                                         |
| `working`   | Claimed by an agent.                                                               |
| `verifying` | Completed and being checked. See [Verification and criteria](/docs/verification/). |
| `rework`    | Checks failed; back to an agent with the output.                                   |
| `blocked`   | Waiting on you (failed too often, can't verify, or needs your approval).           |
| `done`      | Closed with a resolution and a decision record.                                    |
| `cancelled` | Ruled out of scope, or cancelled by an approved reroute.                           |

Every phase change goes through one transition table in code and is appended to the trail's journal.

## Claims are leases

A claim lasts 15 minutes, and every tool call from the claiming agent renews it, including waits on `ask_human`. If the agent goes silent, the lease expires and the ticket goes back to the queue with a **Returned to queue** comment holding the agent's progress notes and decisions. The next agent gets it as a `resume`. Change the length with `--lease-minutes` or `$TEAMTRAIL_LEASE_MINUTES`. In the Lookout, tickets close to expiry show as **Stalled**, and you can release them by hand.

## Decisions

Closing a ticket records a **decision record**: the question, the decision, a summary, the alternatives, the rationale, who decided and, for HITL tickets, the transcript. Agents can also keep other decisions with `record_decision`. Every decision shows in the **Decisions** view and in the briefing, marked as made by you or by an agent, and a later decision can supersede an earlier one. See [File formats](/docs/file-formats/).

## Where it's stored

As markdown in [`.teamtrail/<trail>/`](/docs/teamtrail-folder/), or as issues in [GitHub or Linear](/docs/trackers/), with the same body format.
