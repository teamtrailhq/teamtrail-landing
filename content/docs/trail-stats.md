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

## Where the data comes from

Trail stats reads your trails and the journal in `.teamtrail/.events/`, on your machine. The journal isn't committed, so stats only cover trails worked on from this clone.
