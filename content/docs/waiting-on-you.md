# Waiting on you

One deterministic, ranked list of everything that needs you, with the reason each item ranks where it does.

## What lands in the list

| Kind                | Comes from                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `question`          | An agent asked with `ask_human`.                                                                                                                                                                 |
| `blocked`           | A ticket waits on you: failed too often, or its checks couldn't run.                                                                                                                             |
| `approval`          | Verified work waiting for your sign-off, or a criterion only you can confirm.                                                                                                                    |
| `brief`             | A discovery brief waiting for review.                                                                                                                                                            |
| `reroute`           | A pending reroute proposal. The tickets it touches are frozen. Also an agent's request to skip discovery or change a trail's mode or destination, to **Approve** or **Decline**.                 |
| `reroute-suggested` | A sign the plan may need to change (for example a ticket blocked after its last attempt).                                                                                                        |
| `policy`            | Finished work changed high-risk files without asking you. See [policy.json](/docs/policy-json/).                                                                                                 |
| `integration`       | Two agents' branches changed the same files. See [Parallel work](/docs/parallel-work/).                                                                                                          |
| `overlap`           | Two active claims declared overlapping files.                                                                                                                                                    |
| `stalled`           | A claim whose agent went quiet.                                                                                                                                                                  |
| `flag`              | A pull request or CI result that doesn't match what the agent claimed.                                                                                                                           |
| `hitl-ready`        | A ticket that needs a person and is ready to start.                                                                                                                                              |
| `knowledge`         | Suggested or flagged knowledge entries to review.                                                                                                                                                |
| `model`             | A ready ticket set for a stronger model than any connected agent runs. See [Model matching](/docs/model-matching/).                                                                              |
| `guide`             | A [guide](/docs/guides/) agents can't use: new and not approved, changed since you approved it, or failing the lint.                                                                             |
| `guide-checks`      | Check commands an approved guide proposes, waiting for your approval. They don't run until then.                                                                                                 |
| `trust`             | Something the repo asks this machine to trust: check commands, trail files changed outside Teamtrail, a new tracker in `trackers.json`, and more. See [Approvals and security](/docs/security/). |
| `tracker-settings`  | Someone changed a GitHub or Linear issue's settings: **Accept as is** or **Keep stricter**. See [Who counts as you](/docs/trackers/#who-counts-as-you).                                          |
| `delivery`          | Slack messages keep failing to get through.                                                                                                                                                      |

## How items are ranked

Each item gets a score from fixed rules, added in a fixed order so the reasons always read the same way:

| Points                             | For                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| Half the kind's weight (0–50)      | Weights per kind, from [attention.json](/docs/attention-json/).                         |
| +25 / +10 / 0                      | Urgency: `blocking`, `soon`, `fyi` (questions; agents set it on `ask_human`).           |
| +4 per held ticket, up to 20       | Tickets that can't move until it's handled, counted through blocking edges.             |
| +15                                | An agent sits idle waiting for it.                                                      |
| +1 per 15 minutes waited, up to 10 | Age.                                                                                    |
| −2 per extra question, up to −10   | Several open questions from one agent in a trail: fewer, batched questions rank better. |

Every item carries plain reasons, such as `blocks 4 tickets`, `claude-02 idle for 12 min` or `marked blocking`. Related items in a trail are grouped so you answer them together. Ties break by age, then id, so the order is stable.

## Interruptions

Only items scoring at or above the team's **interrupt** threshold (default 70) notify you actively, by browser notification or Slack. Everything else waits in the list and in the digest. Focus (for an hour or three, from the header's **Focus** control) and your quiet hours hold interruptions back, even urgent ones, but never hide the list. See [Focus in the header](/docs/personal-settings/#focus-in-the-header).

- Team rules: [attention.json](/docs/attention-json/).
- Your channel and quiet hours: [Personal settings](/docs/personal-settings/).

## Snooze and set aside

**Later** snoozes an item (30 minutes, 2 hours or until tomorrow, at most a week). `fyi` and `policy` items can be set aside. Both are stored in `.teamtrail/.attention/state.json`, which stays local.

## From the chat

`list_inbox` returns the same ranked items with their reasons, and `/scout inbox` lists them. Questions can be answered in the chat, and those answers guide the agent. They never pass a gate: a high-risk call or a ticket that's yours to decide needs your answer in the Lookout or Slack. Everything else is decided in the Lookout. Teamtrail never answers or approves on your behalf.
