# Waiting on you

One deterministic, ranked list of everything that needs you, with the reason each item ranks where it does. Only your calls land here: missing evidence and failed checks go back to the agent, and missing reviews open by themselves (see [Done means verified](/docs/verification/#done-means-verified)).

## Where you see it

- **On the Hands-off home.** [Hands-off](/docs/hands-off/), everyone's default, opens on **Needs you**: the list as compact rows, most urgent first, across your trails. One row is open at a time, with the decision in place: answer an agent's question, approve, confirm criteria, approve a whole plan in one step, or act on the checks on main. **Open ticket** opens the full ticket. With nothing waiting, Scout says agents keep going.
- **On the map (Hands-on).** A ticket that needs you is a red card. Click it, and its bubble starts with what it needs from you, with the actions in place: answer the agent's question, approve, unblock or resolve.
- **In the header.** **N need you** counts this trail's items. Click it to open the most urgent one.
- **Under the map.** The trail bar has a chip for each item. **More** opens the whole list, **Needs you**: this trail's items ranked, then the ones on your other trails, each naming its trail. Items that aren't a ticket (a brief, a reroute, an approval on this machine) open their own dialog or page.
- **Across repos.** [All projects](/docs/all-projects/) ranks them in one list.

Every open page keeps up. Answer or approve in one tab, on another device, in Slack or with [`teamtrail approve`](/docs/cli/#teamtrail-approve), and the item leaves the list on every open page at once. Agents waiting for that call [pick up the work](/docs/mcp-tools/#waiting-for-work) as soon as you make it.

## What lands in the list

| Kind                | Comes from                                                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `question`          | An agent asked with `ask_human`.                                                                                                                                                                                                                                                                             |
| `blocked`           | A ticket waits on you: failed too often, or its checks couldn't run.                                                                                                                                                                                                                                         |
| `approval`          | Verified work waiting for your sign-off, or a criterion only you can confirm.                                                                                                                                                                                                                                |
| `brief`             | A discovery brief waiting for review. When its tickets carry criteria, Hands-off shows it as **Approve the plan**: the brief and every ticket's criteria, approved in one step.                                                                                                                              |
| `criteria`          | A ticket's criteria wait for you to confirm them: charted with the ticket (no agent may start it until you do), or a pass against criteria nobody confirmed (checked again by itself once you confirm).                                                                                                      |
| `reroute`           | A pending reroute proposal. The tickets it touches are frozen. Also an agent's request to skip discovery or change a trail's mode or destination, to **Approve** or **Decline**.                                                                                                                             |
| `reroute-suggested` | A sign the plan may need to change (for example a ticket blocked after its last attempt).                                                                                                                                                                                                                    |
| `policy`            | Finished work changed high-risk files without asking you. See [policy.json](/docs/policy-json/).                                                                                                                                                                                                             |
| `precedent`         | Finished work changed files one of your earlier decisions covers: check it still holds.                                                                                                                                                                                                                      |
| `integration`       | Two agents' branches changed the same files. See [Parallel work](/docs/parallel-work/).                                                                                                                                                                                                                      |
| `overlap`           | Two active claims declared overlapping files.                                                                                                                                                                                                                                                                |
| `stalled`           | A claim whose agent went quiet.                                                                                                                                                                                                                                                                              |
| `flag`              | A pull request or CI result that doesn't match what the agent claimed.                                                                                                                                                                                                                                       |
| `merge`             | A done ticket whose pull request is still open. The title says what stands in the way: "PR #12 is still a draft", "has merge conflicts", "changes requested", "checks failing" or "checks still running"; "PR #12 ready to merge" only when nothing does. It goes once the pull request is merged or closed. |
| `main-checks`       | Checks fail on the default branch before agents build on a trail: **Fix main first**, **Drop** or **Start anyway**. Not raised while main has moved since the failing run and the checks run again. See [Checks on main](/docs/verification/#checks-on-main).                                                |
| `trail-checks`      | The trail's checks fail on main once its work is merged together. See [Trail verified together](/docs/verification/#trail-verified-together).                                                                                                                                                                |
| `hitl-ready`        | A ticket that needs a person and is ready to start.                                                                                                                                                                                                                                                          |
| `knowledge`         | Suggested or flagged knowledge entries to review.                                                                                                                                                                                                                                                            |
| `model`             | A ready ticket set for a stronger model than any connected agent runs. See [Model matching](/docs/model-matching/).                                                                                                                                                                                          |
| `guide`             | A [guide](/docs/guides/) agents can't use: new and not approved, changed since you approved it, or failing the lint.                                                                                                                                                                                         |
| `guide-checks`      | Check commands an approved guide proposes, waiting for your approval. They don't run until then.                                                                                                                                                                                                             |
| `trust`             | Something the repo asks this machine to trust: check commands, trail files changed outside Teamtrail, a new tracker in `trackers.json`, and more. See [Approvals and security](/docs/security/).                                                                                                             |
| `tracker-settings`  | Someone changed a GitHub or Linear issue's settings: **Accept as is** or **Keep stricter**. See [Who counts as you](/docs/trackers/#who-counts-as-you).                                                                                                                                                      |
| `tracker-refused`   | GitHub or Linear refused a write for good (lost access, a deleted issue): **Retry** once it's fixed, or **Discard**. See [Staying in step](/docs/trackers/#staying-in-step).                                                                                                                                 |
| `delivery`          | Slack messages keep failing to get through.                                                                                                                                                                                                                                                                  |
| `review-limit`      | The team's review limit is reached: finished work waits for your review, and agents start no new implementation work until you review some. Opens the ticket waiting longest. See [Review capacity](/docs/review-capacity/).                                                                                 |

### From verification

Verification adds work to the list when a pass hasn't earned it yet. Each item says why, and has a way past it:

- **Check guard:** "Checks passed, but the work changed what they run: package.json scripts.test changed". **Accept the pass…** or **Send to rework**. See [Check guard](/docs/verification/#check-guard).
- **Flaky check:** "Passed only on retry: test failed in A-1, then passed on c2201be with no change". **Send to rework** or **Accept the pass…**. See [Flaky checks](/docs/verification/#flaky-checks).
- **Same-model review:** with the `independent-review` gate enforced, "Review #12 waits for an agent on another model than claude-opus-5-5". See [Independent review](/docs/verification/#independent-review).
- **Trail verified together:** "Trail checks fail on main after merging #2, #3", with **Add a fix ticket** and **Run again** on the destination flag. See [Trail verified together](/docs/verification/#trail-verified-together).
- **Came back:** "#7 was verified, then reverted: add a rule?" opens the diff rules editor filled in. See [What came back](/docs/verification/#what-came-back).

Gates in `observe` add nothing here; they only record what they would have held. See [Gates](/docs/verification/#gates-off-observe-enforce).

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

`list_inbox` returns the same ranked items with their reasons, and `/scout inbox` lists them. Questions can be answered in the chat, and those answers guide the agent. They never pass a gate: a ticket that's yours to decide needs your answer in the Lookout or Slack, and a high-risk call your answer in the Lookout. Everything else is decided in the Lookout. Teamtrail never answers or approves on your behalf.
