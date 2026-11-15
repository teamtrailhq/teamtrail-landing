# Verification and criteria

Agents agree on what done means before they start, and every claim of done is checked against your repo's own checks, a second agent's review or your sign-off.

## Verification levels

Each trail has a level; a ticket can override it.

| Level                 | What a completion needs                                           |
| --------------------- | ----------------------------------------------------------------- |
| `off`                 | Nothing: the ticket closes as before.                             |
| `checks`              | The checks in [verification.json](/docs/verification-json/) pass. |
| `checks+review`       | Checks pass, then a different agent reviews the work.             |
| `checks+review+human` | Checks and review pass, then you approve.                         |

New trails start at the `default` level from `verification.json`; the level applies to the ticket types in `appliesTo` (default `execute` and `task`). Without `verification.json`, nothing is verified. Change a trail's level in the ticket inspector or the verification panel, on the machine Teamtrail runs on. A level lowered in the files below the one you approved doesn't apply until you approve it in **Settings → Project → Approvals**.

## What happens on completion

`close_ticket` or `report_completion` runs the checks first. The result's `status` is:

| Status             | Meaning                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `done`             | Closed.                                                                                                                       |
| `rework`           | A check failed; `feedback` has the failing output. The agent fixes it and completes again.                                    |
| `verifying`        | Still running (`pending: true`) or waiting for review. Poll with `verification_status`.                                       |
| `blocked`          | Failed `maxAttempts` times, or the checks couldn't run. You decide.                                                           |
| `waiting-approval` | The check commands aren't approved on this machine yet. The work is kept; approve them in **Settings → Project → Approvals**. |

Checks run with argv arrays (no shell), only once you've [approved the commands](/docs/security/#check-commands) on this machine, with an allowlisted environment and token-shaped output redacted. Results, output and git evidence are stored per attempt in `.teamtrail/.evidence/`.

## Independent review

At `checks+review`, a `review` ticket is created for another agent. The agent that did the work can never review it. When Claude and Codex agents both run, each reviews the other's work first. The reviewer calls `submit_review` with `PASS`, `FAIL` (back for rework with findings) or `NEEDS_HUMAN`. With `reviewer` on the trail's team, review tickets come with the reviewer [guide](/docs/guides/), and the reviewer answers its checklist.

A ticket's guide can add checks from `verification.json` to the ones its completion runs, never remove one or change the level.

## Evidence from git and pull requests

- **Git:** what changed since the claim. A completion with no changes is flagged, unless the ticket type is allowed none (`noChanges`) or the agent gives a `noCodeReason`.
- **Pull requests:** pass `pr` with the completion and Teamtrail tracks the PR and its CI on GitHub (`github` in `verification.json`), flagging results that don't match the claim.
- **Staleness:** if the code or `verification.json` changed since the checks ran, the result is re-verified or flagged (`stale`).

## Verified by Teamtrail

Every completed ticket can carry a report of what Teamtrail recorded, for the pull request that ships it:

- the checks Teamtrail ran itself (command, exit code, duration), not what the agent says it ran;
- each acceptance criterion and its evidence: verified by Teamtrail (`check:` evidence) or only claimed by the agent;
- the git range (base → head, files changed) and any flags;
- the review: who reviewed it, their verdict, and whether the reviewer was independent of the author;
- the decisions the work relies on, on the ticket and on the tickets it was blocked by, each with who made the call.

The report opens with a badge, **Teamtrail verified** or **Teamtrail not verified**. A ticket is verified when its latest attempt passed everything its [level](#verification-levels) asks: the checks passed, no criterion is missing or failed and the criteria were confirmed, plus an independent review at `checks+review`, plus your approval at `checks+review+human`. Otherwise the report lists what's missing, one line each. A completion from a [remote agent](/docs/remote-agents/) is never verified here, because no check ran on this machine.

**Getting the report.** Run [`teamtrail proof <ticket>`](/docs/cli/#teamtrail-proof), or let the agent call [`proof_report`](/docs/mcp-tools/#working-and-completing): agents are told to put it in the pull request description unchanged when they open one. The ticket inspector in the Lookout shows it too, with **Copy for PR**.

**Posted for you.** Switch on **Settings → Project → Proof on pull requests** and, when a ticket is done and its pull request is open, Teamtrail posts the report as one comment on the PR (updated in place, never repeated) and sets a **Teamtrail proof** check next to CI. The check passes only when the ticket is verified at the PR's latest commit. It's off by default and set per machine: each person's Lookout posts with their own GitHub token, to the repo Teamtrail syncs pull requests with (`github` in [verification.json](/docs/verification-json/)). A post that fails (offline, a rate limit) is tried again on the next sync.

**Signed, and checkable by anyone.** Every report is signed with a key made for your machine, which never leaves it. The first time Teamtrail signs one, it writes the public half to `.teamtrail/proof-keys/<id>.pub`: commit it, and anyone can check a report:

```bash
teamtrail proof verify report.md            # a report saved to a file (or stdin)
teamtrail proof verify --pr 42 --repo o/r   # every report on a pull request, at its latest commit
```

A report verifies when it is signed by a key committed in the repo, unchanged since Teamtrail wrote it, verified, and (for a pull request) made at the PR's head. Keys are read from a commit, never from your working copy, so a key someone adds in a pull request counts only once it's merged.

**As a required check.** The Verified by Teamtrail GitHub Action runs the same check with the default branch's keys and records it as the `Teamtrail proof verified` status:

```yaml
# .github/workflows/teamtrail-proof.yml
name: Teamtrail proof
on:
  pull_request:
    types: [opened, synchronize, reopened, edited]
  issue_comment:
    types: [created, edited]
permissions:
  contents: read
  pull-requests: read
  statuses: write
jobs:
  proof:
    if: github.event_name == 'pull_request' || github.event.issue.pull_request
    runs-on: ubuntu-latest
    steps:
      - uses: teamtrailhq/teamtrail/actions/proof@main
```

Add `Teamtrail proof verified` to the branch's required checks, with GitHub Actions as its source, and a pull request without a valid proof can't merge.

**What it is, and isn't.** The report is built from records kept on your machine, and nothing about your project goes anywhere else: the badge is a fixed image that GitHub fetches from teamtrail.app through its own image proxy, and the comment is posted with your token. A signature proves the report came from a Teamtrail on a machine whose key your repo lists, and that nothing in it changed since. It doesn't judge the code, and anyone who can read that machine's key file could sign a report.

## Acceptance criteria

Before working a `task`, `execute` or `prototype` ticket, the agent calls `set_criteria`: numbered points (`AC-1`, `AC-2`, …), each with a kind (`unit`, `integration`, `e2e`, `regression`, `business-rule`, `security`, `manual`) and optionally the knowledge entry it comes from. Criteria are required on trails with a discovery brief, unless verification is `off`. Business rules from [project knowledge](/docs/discovery-and-knowledge/) are suggested as criteria, and the inspector shows rules no criterion covers yet. You can confirm a ticket's criteria in the inspector.

When completing, the agent gives evidence for each criterion:

| Evidence        | Means                                                       |
| --------------- | ----------------------------------------------------------- |
| `check:<name>`  | A check from `verification.json` that passed.               |
| `test:<name>`   | A named test.                                               |
| `command:<cmd>` | A command that was run.                                     |
| `pr`            | The pull request.                                           |
| `manual`        | Only you can confirm it: it comes to your list to sign off. |

A criterion without evidence, or whose check failed, sends the work back with the reason. Criteria are stored in `criteria/<trail>.md`.
