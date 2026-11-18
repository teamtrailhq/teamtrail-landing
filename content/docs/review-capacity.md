# Review capacity

Agents write code faster than people can review it. Teamtrail paces agents to how fast you review, and keeps the review short: the review limit stops new work while finished work waits for you, and the scope check shows the reviewer what changed beyond what the agent said it would change.

## Why

A study of 655 companies (Chen and Stratton, Harvard, _Artificial Intelligence in the Firm: Bottlenecks in Software Production_, November 2026) found that after teams adopted AI coding agents:

- pull requests opened rose by 36%, but resolved issues rose by only 14%;
- the time from a pull request to its approval rose by 56%, split between waiting for a reviewer (+60%) and time in review (+59%);
- comments per pull request rose by 39%.

Writing code stopped being the bottleneck; reviewing it became one. More code in the queue only makes the queue longer. Teamtrail measures done by verified acceptance criteria, not by code written, and the two settings below act on the review queue directly.

## The review limit

Set how many finished tickets may wait for review. Once that many wait, agents start no new implementation work until you review some.

**What counts as waiting**, across every trail of the project (one person reviews them all):

- tickets waiting for your approval or sign-off in the Lookout (`approval` items in [Waiting on you](/docs/waiting-on-you/));
- done tickets whose pull request is still open, when [PR tracking](/docs/verification-json/#github) is on and running.

Each ticket counts once. A deleted ticket never counts, and while PR sync is stopped or overdue, open pull requests don't count, so a stale snapshot never holds agents back.

**What waits** while the limit is reached: new `task`, `execute` and `prototype` tickets. `next_ticket`, `claim_ticket` and `resume_trail` don't offer them, and claiming one by key is refused with the reason. **What goes on:** rework (it finishes work already in the queue), and `research`, `junction` and `review` tickets, which add no code to review. Agents see `reviewLimit` in their results, with the tickets that wait, and tell you. An agent with nothing else to take [waits for work](/docs/mcp-tools/#waiting-for-work) and starts the moment your review frees the limit.

**In Waiting on you**, a `review-limit` item says how much waits and how many ready tickets it holds back. It opens the ticket that has waited longest, the one to review first.

**Set it** in **Settings → Attention → Review limit** (Off, 3, 5, 8 or 12), or as `reviewLimit` in [attention.json](/docs/attention-json/). It's off until you set it. It paces work, it doesn't guard anything: an agent that can edit `attention.json` can lift it.

## The scope check

When an agent claims a ticket it says which files it will change (`claim_ticket` `touches`, path globs). When it completes, Teamtrail compares those with the files git saw change since the claim:

- **All inside:** an `in-scope` note: every change stayed within what the agent declared.
- **Some outside:** an `outside-scope` flag listing them. That's code nobody asked for, and review nobody planned.
- **Nothing declared:** nothing to compare, so no flag. Declaring files is how an agent gets its work checked for scope.

A declared folder (`src/search`) covers everything under it; a glob (`src/search/**/*.ts`) covers what it matches.

**Where it shows:**

- the review ticket asks the reviewer to start with the files outside the declared scope;
- the ticket's verification panel lists the flag, and marks those files in **Changed files**;
- the [proof](/docs/verification/#verified-by-teamtrail) on the pull request has a **Scope** line: every change inside the declared files, or which files were outside.

**What it does** is `scope` in [verification.json](/docs/verification-json/), set in **Settings → Verification → Changes outside the files an agent declared**:

| Setting           | `scope`   | What happens                                                                                                                       |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Show the reviewer | `"flag"`  | Default. The flag is shown; the checks and review go on.                                                                           |
| Send back         | `"fail"`  | The attempt fails before any check runs: the agent reverts the files, or claims again with `touches` that cover them and says why. |
| Ask me            | `"human"` | The ticket waits for you to decide.                                                                                                |

Changing it in the Lookout approves `verification.json` in the same step, so it's refused while the file has changes you haven't approved: approving one setting never approves check commands you didn't see.

The check works the same for agents on another machine whose checks run on a check runner, as in Teamtrail Cloud: the runner reports the files it saw change.

## Teamtrail Cloud

Both settings are in the same places in a Cloud workspace's Lookout. Workspace owners set them; members and viewers see them. While the review limit holds a trail's ready work back, Cloud starts no agent on it, and the Agents page says the trail waits for your review.
