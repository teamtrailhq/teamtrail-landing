# Verification and criteria

Agents agree on what done means before they start, and every claim of done is checked against your repo's own checks, a review by an agent on another model or your sign-off. Gates make a pass earn it: the work can't change what its checks run, a flaky pass doesn't count, rules from past mistakes apply to the files they cover, and the whole trail is verified together on your default branch once it's merged.

On this page:

- [Verification levels](#verification-levels) and [what happens on completion](#what-happens-on-completion)
- [Gates: off, observe, enforce](#gates-off-observe-enforce)
- [Check guard](#check-guard), [flaky checks](#flaky-checks) and [diff rules](#diff-rules)
- [Independent review](#independent-review)
- [Trail verified together](#trail-verified-together)
- [What came back](#what-came-back)
- [Verified by Teamtrail](#verified-by-teamtrail), the signed proof
- [Acceptance criteria](#acceptance-criteria)

## Verification levels

Each trail has a level; a ticket can override it.

| Level                 | What a completion needs                                           |
| --------------------- | ----------------------------------------------------------------- |
| `off`                 | Nothing: the ticket closes as before.                             |
| `checks`              | The checks in [verification.json](/docs/verification-json/) pass. |
| `checks+review`       | Checks pass, then a different agent reviews the work.             |
| `checks+review+human` | Checks and review pass, then you approve.                         |

New trails start at the `default` level from `verification.json`; the level applies to the ticket types in `appliesTo` (default `execute` and `task`). Without `verification.json`, nothing is verified. Change a trail's level in a ticket's **Full ticket** (open its card on the map) or the verification panel, on the machine Teamtrail runs on. A level lowered in the files below the one you approved doesn't apply until you approve it in **Settings → Project → Approvals**.

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

A pass that a [gate](#gates-off-observe-enforce) holds back doesn't close the ticket: it waits for you in [Waiting on you](/docs/waiting-on-you/), with the reason and a way past it.

## Gates: off, observe, enforce

A gate is a rule a pass has to meet before it counts. Each gate has a mode:

| Mode      | What it does                                                                                                                                     |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `off`     | Nothing.                                                                                                                                         |
| `observe` | Records what the gate would have held back, and lets the work through. Use it to see what a gate would do on your project before you rely on it. |
| `enforce` | Holds the work for you. There is always a way past it: you can accept the pass anyway or send the work back.                                     |

| Gate                 | Default   | Holds back                                                                      |
| -------------------- | --------- | ------------------------------------------------------------------------------- |
| `check-guard`        | `enforce` | A pass where the work changed what its checks run, or skipped or removed tests. |
| `flaky`              | `enforce` | A check that failed and then passed on the same commit.                         |
| `diff-rules`         | `enforce` | A change that touched a rule's files without running its check or answering it. |
| `independent-review` | `observe` | A review by an agent on the same model as the work's author.                    |

Set the modes in **Settings → Verification → Gates**. They're stored in `gates` in [verification.json](/docs/verification-json/#gates), and approved like the check commands: a mode lowered in the file (for example from `enforce` to `observe`, or to `off`) doesn't apply until you approve it on this machine. The page also shows, per gate, what it held back lately, or would have held back in observe.

## Check guard

A check proves something only if the work didn't change the check. The check guard (gate `check-guard`, enforced by default) counts a pass only when the work's changes left alone:

- what the check runs: the `package.json` scripts it calls, the test runner's config, and the scripts the check's command runs;
- any files a check names in its own `guards` (globs, in [verification.json](/docs/verification-json/#a-check)), for what Teamtrail can't see from the command;
- the tests themselves: a change that skips tests (`.skip`, `xit`, `@pytest.mark.skip` and the like) or removes them is held too.

When the guard holds a pass, the ticket waits for you with what changed: **Accept the pass** if the change to the check was intended, or **Send it back**. The [proof](#verified-by-teamtrail) says which you chose: a pass you accepted over the guard is shown as accepted by you, not as a clean pass.

This narrows the limit in [Approvals and security](/docs/security/#check-commands): approving `npm run check` still approves only the command line, but an agent that edits the scripts behind it can no longer turn its own failure into a pass unnoticed.

## Flaky checks

A check that fails and then passes on the same commit tells you nothing about the code. With the `flaky` gate (enforced by default) such a pass doesn't count as verified until you accept it, and the ticket waits for you with both runs.

Agents are told never to rerun a check hoping for a pass, add sleeps or retries to make one pass, or skip a test that fails. **Settings → Verification** lists the checks that have been flaky, with how often, so you can fix the test rather than accept it every time.

## Diff rules

Diff rules turn past mistakes into checks for the next change in the same place. Each rule in `rules` in [verification.json](/docs/verification-json/#rules) has:

- `when`: file globs. The rule applies only when the change touched one of them.
- a `check` to run (a check defined in `checks`), or a question to `ask` that the agent must answer on its completion;
- `why`: the incident behind it, shown to the agent and to you.

```json
"rules": [
  {
    "when": ["db/migrations/**"],
    "check": "migrate-roundtrip",
    "why": "A migration without a down step broke the rollback on 3 March."
  },
  {
    "when": ["src/billing/**"],
    "ask": "Does this change what a customer is charged? How did you check it?",
    "why": "A rounding change double-charged annual plans."
  }
]
```

When an agent claims a ticket, it's told which rules are likely to apply, from the files it said it would change. At completion, only rules whose files the change actually touched apply. With the `diff-rules` gate enforced (the default), a completion that touched a rule's files without passing its check or answering its question waits for you; the answers go on the ticket and the proof.

Edit rules in **Settings → Verification → Rules**. A rule's `check` runs only once its command is approved, like any check. [What came back](#what-came-back) offers to add a rule from each ticket that was verified and later reopened.

## Independent review

At `checks+review`, a `review` ticket is created for another agent. The agent that did the work can never review it, and review tickets go first to agents on a different model from the author's, so Claude's work is reviewed by Codex and the other way round when both are connected.

The `independent-review` gate decides what happens when the only reviewer is on the same model. In `observe` (the default) the review counts and is flagged as same-model, on the ticket and the proof. In `enforce` the review waits for an agent on another model; you can accept the same-model review anyway. The proof always shows the author's and the reviewer's models. The reviewer calls `submit_review` with `PASS`, `FAIL` (back for rework with findings) or `NEEDS_HUMAN`. With `reviewer` on the trail's team, review tickets come with the reviewer [guide](/docs/guides/), and the reviewer answers its checklist.

A ticket's guide can add checks from `verification.json` to the ones its completion runs, never remove one or change the level.

## Evidence from git and pull requests

- **Git:** what changed since the claim. A completion with no changes is flagged, unless the ticket type is allowed none (`noChanges`) or the agent gives a `noCodeReason`.
- **Scope:** files changed outside the ones the agent declared at its claim (`touches`) are flagged `outside-scope` and listed first for the reviewer; `scope` in `verification.json` can instead send the work back or to you. See [the scope check](/docs/review-capacity/#the-scope-check).
- **Pull requests:** pass `pr` with the completion and Teamtrail tracks the PR and its CI on GitHub (`github` in `verification.json`), flagging results that don't match the claim.
- **Staleness:** if the code or `verification.json` changed since the checks ran, the result is re-verified or flagged (`stale`).

## Trail verified together

Every ticket can pass on its own branch and the trail still break once they're merged together. So once a trail's pull requests are merged, Teamtrail runs the approved checks again on your default branch, at a commit that contains all of the trail's tickets.

- The trail counts as **done and verified** only when that combined run passes. Until then it's done, not verified.
- A failure becomes an item in [Waiting on you](/docs/waiting-on-you/) with the failing output, and offers to add a fix ticket to the trail.
- **Run now** starts the combined run before everything is merged, on the default branch as it is, to catch trouble early.

The trail's proof lists every ticket's proof and the combined run: the commit, the checks and their results.

## What came back

A ticket that was verified and later reopened, or whose change was reverted, came back. Teamtrail counts these and shows them on the [scorecard](/docs/trail-stats/#scorecard), by model, agent, ticket type and check, so you can see which checks let bad work through. Each one offers to add a [diff rule](#diff-rules) from it: the files it touched as `when`, and what went wrong as `why`.

## Verified by Teamtrail

Every completed ticket can carry a report of what Teamtrail recorded, for the pull request that ships it:

- the checks Teamtrail ran itself (command, exit code, duration), not what the agent says it ran;
- each acceptance criterion and its evidence: verified by Teamtrail (`check:` evidence) or only claimed by the agent;
- the git range (base → head, files changed) and any flags;
- the scope: whether every change stayed inside the files the agent declared, or which didn't;
- the review: who reviewed it, their verdict, whether the reviewer was independent of the author, and the author's and the reviewer's models;
- what the [gates](#gates-off-observe-enforce) found: a pass accepted over the check guard or as flaky, the diff rules that applied and their answers;
- the decisions the work relies on, on the ticket and on the tickets it was blocked by, each with who made the call, by name: git's `user.name` on the machine where you decided, or the person signed in to a hosted Lookout.

The report opens with a badge, **Teamtrail verified** or **Teamtrail not verified**. A ticket is verified when its latest attempt passed everything its [level](#verification-levels) asks: the checks passed, no criterion is missing or failed and the criteria were confirmed, plus an independent review at `checks+review`, plus your approval at `checks+review+human`, and no enforced gate holds it (or you accepted it past the gate, which the report says). Otherwise the report lists what's missing, one line each. A completion from a [remote agent](/docs/remote-agents/) is never verified here, because no check ran on this machine.

**Getting the report.** Run [`teamtrail proof <ticket>`](/docs/cli/#teamtrail-proof), or let the agent call [`proof_report`](/docs/mcp-tools/#working-and-completing): agents are told to put it in the pull request description unchanged when they open one. In the Lookout, the ticket's **Full ticket** shows it too, with **Copy for PR**.

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

Before working a `task`, `execute` or `prototype` ticket, the agent calls `set_criteria`: numbered points (`AC-1`, `AC-2`, …), each with a kind (`unit`, `integration`, `e2e`, `regression`, `business-rule`, `security`, `manual`) and optionally the knowledge entry it comes from. Criteria are required on trails with a discovery brief, unless verification is `off`. Business rules from [project knowledge](/docs/discovery-and-knowledge/) are suggested as criteria, and the ticket's bubble on the map shows rules no criterion covers yet. You can confirm a ticket's criteria in its **Full ticket**.

When completing, the agent gives evidence for each criterion:

| Evidence        | Means                                                       |
| --------------- | ----------------------------------------------------------- |
| `check:<name>`  | A check from `verification.json` that passed.               |
| `test:<name>`   | A named test.                                               |
| `command:<cmd>` | A command that was run.                                     |
| `pr`            | The pull request.                                           |
| `manual`        | Only you can confirm it: it comes to your list to sign off. |

A criterion without evidence, or whose check failed, sends the work back with the reason. Criteria are stored in `criteria/<trail>.md`.
