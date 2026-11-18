# Trail stats

How your agents deliver across every trail, by vendor, agent and ticket type. Open it from **Records → Trail stats** in the Lookout.

## What you see

Each row shows the median time from first claim to done, then the counts behind it.

| Number          | What it counts                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Tickets done    | Tickets closed as completed, out of all tickets for that row.                                     |
| Reworks         | Times the work went back to rework.                                                               |
| Reviews         | Verdicts on that row's work: passed and failed.                                                   |
| Questions       | Questions the agent asked that a person answered. Not shown by ticket type.                       |
| Findings upheld | As a reviewer: failed reviews that stood. A finding is overruled when you accept the work anyway. |

A ticket counts for the agent that last claimed it. If the [journal](/docs/teamtrail-folder/) has no claim, it counts for its assignee when that's an agent. Tickets assigned to a person appear by ticket type only. The vendor comes from the agent's trail name: `claude-01` is `claude`.

Spend isn't split by agent, because usage is recorded per trail. Each trail's [report](/docs/the-lookout/) shows its spend.

## What stands out

Plain notes from your own numbers, such as one vendor's findings being upheld more often. A note only appears when both sides have at least 5 results and the difference is large enough to matter.

They're information for you. Teamtrail doesn't route work from them. The same numbers per ticket type show next to the tiers in **Settings → Model matching**, to help you set them; see [Model matching](/docs/model-matching/).

## Scorecard

How each model, agent and vendor does on your own tickets, measured from the checks Teamtrail ran, by ticket type and model, by model, by vendor and by agent:

| Number              | What it counts                                                                                                                                                                                                          |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Verified first time | Tickets whose first completion passed everything, out of all tickets the group made a completion for.                                                                                                                   |
| Rework              | Tickets that needed more than one attempt.                                                                                                                                                                              |
| Attempts each       | Attempts per verified ticket.                                                                                                                                                                                           |
| Cost per verified   | The group's spend over its verified tickets. Each session's spend is split evenly over the tickets it submitted.                                                                                                        |
| Review findings     | Errors and warnings reviewers raised on the group's work.                                                                                                                                                               |
| Came back           | Count and rate of tickets verified and later reopened, or reverted on the default branch. **By type** splits it by ticket type; **Came back** shows it per check that passed, to find checks that let bad work through. |

A ticket counts for whoever made its first completion, with the model that session ran on. Each ticket that came back offers to add a [diff rule](/docs/verification/#diff-rules) from it; see [What came back](/docs/verification/#what-came-back). Groups under 10 tickets show as **too few** and are never compared. **Copy as Markdown** puts the scorecard on your clipboard, to share with your team.

When two models with enough tickets differ on a ticket type, **Settings → Model matching** suggests a tier for it, with the numbers; see [Model matching](/docs/model-matching/#suggestions-from-your-scorecard).

## Flaky checks

**Flaky checks** lists every check that passed only on retry, with nothing changed: its failing test (when the output names one), how often, the tickets it hit and when it was last seen. See [Flaky checks](/docs/verification/#flaky-checks).

## Where the data comes from

Trail stats reads your trails and the journal in `.teamtrail/.events/`, on your machine. The journal isn't committed, so stats only cover trails worked on from this clone.
