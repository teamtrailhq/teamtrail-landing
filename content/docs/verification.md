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

New trails start at the `default` level from `verification.json`; the level applies to the ticket types in `appliesTo` (default `execute` and `task`). Without `verification.json`, nothing is verified. Change a trail's level in the ticket inspector or the verification panel.

## What happens on completion

`close_ticket` or `report_completion` runs the checks first. The result's `status` is:

| Status      | Meaning                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------ |
| `done`      | Closed.                                                                                    |
| `rework`    | A check failed; `feedback` has the failing output. The agent fixes it and completes again. |
| `verifying` | Still running (`pending: true`) or waiting for review. Poll with `verification_status`.    |
| `blocked`   | Failed `maxAttempts` times, or the checks couldn't run. You decide.                        |

Checks run with argv arrays (no shell), with tokens kept out of their environment and token-shaped output redacted. Results, output and git evidence are stored per attempt in `.teamtrail/.evidence/`.

## Independent review

At `checks+review`, a `review` ticket is created for another agent. The agent that did the work can never review it. When Claude and Codex agents both run, each reviews the other's work first. The reviewer calls `submit_review` with `PASS`, `FAIL` (back for rework with findings) or `NEEDS_HUMAN`.

## Evidence from git and pull requests

- **Git:** what changed since the claim. A completion with no changes is flagged, unless the ticket type is allowed none (`noChanges`) or the agent gives a `noCodeReason`.
- **Pull requests:** pass `pr` with the completion and Teamtrail tracks the PR and its CI on GitHub (`github` in `verification.json`), flagging results that don't match the claim.
- **Staleness:** if the code or `verification.json` changed since the checks ran, the result is re-verified or flagged (`stale`).

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
