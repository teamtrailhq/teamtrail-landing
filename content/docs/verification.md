# Verification and criteria

Agents agree on what done means before they start, and every claim of done is checked against your repo's own checks, a review by an agent on another model or your sign-off. Gates make a pass earn it: the work can't change what its checks run or weaken the tests, a pass on retry doesn't count, rules from past mistakes apply to the files they cover, reviews go to another model, and the whole trail is verified together on your default branch once it's merged.

On this page:

- [Verification levels](#verification-levels) and [what happens on completion](#what-happens-on-completion)
- [Done means verified](#done-means-verified): gaps that close themselves, and the few that are yours
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

Before anything runs, **Settings → Verification** reads the repo to say whether each check can run as written: the `package.json` script (in the workspace `-w` or `--filter` names), the project file its tool needs (`go.mod`, `Cargo.toml`, `build.gradle`, `pom.xml`, `Gemfile`, `pyproject.toml` and `uv.lock`, `composer.json`, `Package.swift`, `mix.exs`, `pubspec.yaml`…), a Gradle or Maven wrapper's own files, a turbo task. **Won't run** says why: "No `e2e` script in package.json" is the repo, while "`ng` isn't installed: no node_modules in `apps/web`; install the dependencies first (`npm ci` in `apps/web`)" is this machine, fixed by installing. Nothing runs to find out, and it's advice: you can keep a check anyway.

A pass that a [gate](#gates-off-observe-enforce) holds back doesn't close the ticket: it waits for you in [Waiting on you](/docs/waiting-on-you/), with the reason and a way past it.

## Done means verified

A ticket is done when its work is verified, not when an agent says so. Whatever stands between a completion and a verified proof is a **gap**, and most gaps close without you: only your calls come to you.

**Criteria before work.** Criteria an agent charts with a ticket wait for you to confirm them before any agent is offered the ticket or may claim it; until then it's a `criteria` item in [Waiting on you](/docs/waiting-on-you/). On a trail with a discovery brief, [Approve the plan](/docs/hands-off/#approve-the-plan) confirms every ticket's criteria together with the brief. Tickets charted without criteria get them from their agent at the claim, as before.

**A pass against criteria nobody confirmed waits.** If the work passes against criteria you never confirmed (a ticket started before you looked at them), it doesn't close: it waits in `verifying`, as a `criteria` item. **Confirm criteria** and Teamtrail checks the work again by itself, on the same commit: a new attempt graded against the criteria you confirmed, with the [flaky gate](#flaky-checks) and the [check guard](#check-guard) as on any run. If the code moved on since, or more than a regrade would be needed, it says so and the ticket goes back to its agent instead. A ticket an older version closed that way can be confirmed and **verified again** from its proof.

**Every gap says who closes it.** The ticket's **Proof** lists each gap with who is on it, and when it's yours, the button that closes it (the first one is also the ticket's main action):

| Gap                                                     | Who closes it                                                                                                                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A check failed, evidence is missing, a criterion failed | The agent: the work goes back for rework, with the reason. If agents can't close it after `maxAttempts`, it's yours: **Send to rework**, or accept it as it is. |
| No independent review yet                               | An agent: a review opens by itself once the checks pass, first for an agent on another model.                                                                   |
| A failed review                                         | The agent, in rework.                                                                                                                                           |
| Criteria not confirmed                                  | You: **Confirm criteria** (the work is checked again by itself), or **Confirm criteria and verify again** on a done ticket.                                     |
| A pass held by the check guard or the flaky gate        | You: **Accept the pass…** with a reason, or **Send to rework** to fix the cause.                                                                                |
| Your approval, at `checks+review+human`                 | You: **Approve**, or **Send to rework**.                                                                                                                        |
| A diff rule's question unanswered                       | The agent, when you send it back.                                                                                                                               |
| A check that fails on main too                          | Main: a completion after main is fixed proves it. **Open checks on main** shows them.                                                                           |
| A check you waived                                      | Accepted already. **Run test again** (named for the check) undoes it and sends the ticket back to the queue.                                                    |
| Closed without a completion, or with verification off   | Nobody: a past attempt is never rewritten. Only a new completion can prove it.                                                                                  |
| Reopened after it was done                              | An agent: the last completion no longer counts ("The ticket isn't done any more"), and a new completion proves it.                                              |

The ticket's pull request sits at the top of the ticket and on its map card: its state (**Open**, **Draft**, **Merged** or **Closed**), its checks, and whether it is (or was merged) at the commit the proof covers or a newer one. While it's open, it also says what stands in its way: changes requested, merge conflicts, failing or pending checks, or that it was approved.

A done ticket that isn't verified offers **Merge anyway** where Teamtrail merges pull requests ([Teamtrail Cloud](/docs/cloud/#auto-merge)): it names the gaps, asks once, and keeps your answer as your decision. Verified work there merges by itself, or with **Approve and merge**. Neither is ever offered on a pull request that is already merged or closed. A merge Teamtrail makes shows as **Merged** on the ticket at once, on every open page; a merge on GitHub shows at the next [PR sync](/docs/verification-json/#github).

When a pull request is closed without merging and a new one opens for the same ticket (on the same branch, or with the ticket's marker in its body), the ticket follows the new one. A link you set by hand stays as you set it.

To point a ticket at another pull request yourself, open the ticket and use **Link a different PR** in its pull request block. Pick one of the repo's pull requests (the ticket's own come first), or type its number or paste its link. Teamtrail checks with GitHub that the pull request exists, and the block shows it at once. **Unlink** removes the link, and Teamtrail won't link that pull request to the ticket again unless you do. A ticket without a pull request offers **Link a pull request** in the full ticket. Both are recorded in the trail's history and work only on the machine Teamtrail runs on, because they decide which pull request your machine posts the proof to.

When a ticket is closed, reopened or removed, from the Lookout, by an agent or by a teammate, PR sync runs within seconds, so the review queue and the proof on its pull request follow at once.

## Gates: off, observe, enforce

A gate is a rule a pass has to meet before it counts. Each gate has a mode:

| Mode      | What it does                                                                                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `off`     | Nothing.                                                                                                                                                                |
| `observe` | Records what the gate would have held back and lets the work through, shown to the reviewer and on the proof. Use it to see what a gate would do on your project first. |
| `enforce` | Holds the work for you. There is always a way past it.                                                                                                                  |

| Gate                 | Default   | What it looks at                                                                          |
| -------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `check-guard`        | `enforce` | A pass where the work changed what its checks run, or weakened the tests.                 |
| `flaky`              | `enforce` | A check that passed only on retry, with nothing changed.                                  |
| `diff-rules`         | `enforce` | A change that touched a rule's files without passing its check or answering its question. |
| `independent-review` | `observe` | A review by an agent on the same model as the work's author.                              |

Set them in **Settings → This trail → Gates** (`?settings=gates`): one row per gate with **Off**, **Observe** and **Enforce**, and what it did lately, such as "Held 2 tickets in the last 14 days" or, in observe, "Would have held 3 tickets in the last 14 days". Expand a row to see those tickets; click one to open it on the map.

The modes are stored in `gates` in [verification.json](/docs/verification-json/#gates). Changing a mode in Settings writes the file and approves it in one step, on the machine Teamtrail runs on only; anywhere else the page is read-only ("Set on the machine Teamtrail runs on."). A mode lowered in the file by hand (an agent's edit, a teammate's push) waits for your approval like a changed check command, and the approved mode holds meanwhile.

## Check guard

A check proves something only if the work didn't change the check. The check guard (gate `check-guard`, enforced by default) looks at the change against what the checks run:

- the `package.json` scripts a check reaches, including nested `npm run`, `pre` and `post` scripts and workspace runs, `composer.json` scripts, the scripts `turbo run` runs in each package, and the Nx targets `nx test web` runs (their definition in `project.json` and the commands they run);
- the tool behind `bundle exec`, `poetry run`, `uv run`, `pipenv run`, `composer exec`, `vendor/bin/…` or `.venv/bin/…`, and the build `./gradlew` or `./mvnw` runs;
- the config of the tools those run, for every common stack: Gradle build scripts and the wrapper's distribution, `pom.xml` and `.mvn/`, .NET project files, `Directory.Build.props` and runsettings, `.cargo/config.toml`, RuboCop's todo file, PHPStan's and Psalm's baselines, a coverage threshold, `Package.swift`, `angular.json`… (for `pyproject.toml`, `setup.cfg`, `tox.ini` and `Cargo.toml`, only that tool's section, so a new dependency isn't a finding);
- files the check commands name, and the makefile rules a `make` target reaches;
- any files a check names in its own `guards` (globs, `checks.<name>.guards` in [verification.json](/docs/verification-json/#a-check)), for what Teamtrail can't see from the command.

It also looks for weakened tests: deleted test files, removed or commented-out tests, and added `.skip`, `xit`, `it.todo`, `@pytest.mark.skip`, `t.Skip(`, `#[ignore]`, `@Disabled`, xUnit's `Skip =`, `[Ignore]`, `markTestSkipped`, `XCTSkip`, `@tag :skip`, Dart's `skip:` or `.only`. These are counted net, in files that existed before the work, so new, renamed or edited tests are fine.

**Enforce.** The ticket waits for you, with what changed: "Checks passed, but the work changed what they run: package.json scripts.test changed". Choose **Accept the pass…** if the change was intended, or **Send to rework**, and the agent is told what to undo. Until you accept, the [proof](#verified-by-teamtrail) has a gap; after, it says "Changed what its checks run (accepted by …)".

**Observe.** The pass counts, and what changed is shown to the reviewer and on the proof.

Completions checked by a remote [check runner](/docs/remote-agents/) get the same rules. This narrows the limit in [Approvals and security](/docs/security/#check-commands): approving `npm run check` still approves only the command line, but work that edits the scripts behind it no longer passes unnoticed.

## Flaky checks

A check that fails and then passes with nothing changed tells you nothing about the code. The `flaky` gate (enforced by default) catches a check that failed, timed out or couldn't start, then passed with the same command, on the same commit and with the same uncommitted changes.

**Enforce.** The ticket waits for you: "Passed only on retry: test failed in A-1, then passed on c2201be with no change". Choose **Send to rework** or **Accept the pass…**; an accepted pass shows on the proof as "passed on retry · the trail lead accepted the pass".

Agents are told never to rerun a check hoping for a pass, add sleeps or retries to make one pass, or skip a test that fails. **Trail stats → Flaky checks** lists each flaky check with its failing test (when the output names one), how often, the tickets it hit and when it was last seen, so you can fix the test rather than accept it every time.

## Diff rules

Diff rules turn past mistakes into checks for the next change in the same place. Each rule in `rules` in [verification.json](/docs/verification-json/#rules) has:

- `id`: `R-1`, `R-2`, …; a new rule gets the next one;
- `when`: 1 to 20 file globs. The rule applies only when the change touched one of them;
- a `check` to run (a check defined in `checks`), a question to `ask` the agent, or both;
- `why`: the incident behind it, shown to the agent and to you.

```json
"rules": [
  {
    "id": "R-1",
    "when": ["db/migrations/**"],
    "check": "migrate-roundtrip",
    "why": "A migration without a down step broke the rollback on 3 March."
  },
  {
    "id": "R-2",
    "when": ["src/billing/**"],
    "ask": "Does this change what a customer is charged? How did you check it?",
    "why": "A rounding change double-charged annual plans."
  }
]
```

Up to 50 rules. When an agent claims a ticket with the files it will change (`touches`), it's told which rules are likely to apply. At completion only the rules whose files the change actually touched apply: their checks run, and the agent answers their questions in `ruleAnswers`. With the `diff-rules` gate enforced (the default), a completion that leaves a matched question unanswered is refused. A rule's check is verified like any check; answers are shown as claimed, on the ticket and the proof.

In a ticket's **Full ticket**, **Go without** waives a rule for that ticket only. It's a Lookout action, and it's journaled.

Manage rules in **Settings → This trail → Diff rules** (`?settings=rules`): list, add, edit and remove them, with when each last matched. A rule's `check` runs only once its command is approved, like any check. [What came back](#what-came-back) offers to add a rule from each ticket that was verified and later came back.

## Independent review

At `checks+review`, a `review` ticket is created for another agent. The agent that did the work can never review it, and review tickets are offered first to agents on a different model from the author's.

Two agents are on the same model when their model ids match after dropping the date, the provider prefix and suffixes like `-latest`. Different versions are different models, and so are different sizes of one family (Opus and Sonnet). The `independent-review` gate decides what a same-model review is worth:

- **Observe** (the default): the review counts, and the proof says it was reviewed by the same model.
- **Enforce**: a same-model `PASS` doesn't count. A new review waits for an agent on another model ("Review #12 waits for an agent on another model than claude-opus-5-5"). You can **Approve** the work anyway, but its proof stays not verified.

The proof and the Lookout name both: "Reviewed by claude-03 on claude-opus-5-5 · the same model as the author" when they match. The reviewer calls `submit_review` with `PASS`, `FAIL` (back for rework with findings) or `NEEDS_HUMAN`. With `reviewer` on the trail's team, review tickets come with the reviewer [guide](/docs/guides/), and the reviewer answers its checklist.

A ticket's guide can add checks from `verification.json` to the ones its completion runs, never remove one or change the level.

## Evidence from git and pull requests

- **Git:** what changed since the claim. A completion with no changes is flagged, unless the ticket type is allowed none (`noChanges`) or the agent gives a `noCodeReason`.
- **Scope:** files changed outside the ones the agent declared at its claim (`touches`) are flagged `outside-scope` and listed first for the reviewer; `scope` in `verification.json` can instead send the work back or to you. See [the scope check](/docs/review-capacity/#the-scope-check).
- **Pull requests:** pass `pr` with the completion and Teamtrail tracks the PR and its CI on GitHub (`github` in `verification.json`), flagging results that don't match the claim. Merged and closed pull requests, and branches with no pull request, are asked about at most once an hour, so PR sync asks GitHub less as your history grows. A deleted ticket's pull request is dropped.
- **Staleness:** if the code or `verification.json` changed since the checks ran, the result is re-verified or flagged (`stale`).

## Checks on main

Before agents build on a trail, Teamtrail runs your approved checks once on the default branch's head, so a failure that was already there isn't blamed on the agents' work. They run in a separate worktree next to the repo, never in your working tree (in [Cloud](/docs/cloud/), in its check sandbox). The map shows them as `main` at the start of the trail.

- **While the first run goes**, agents start no implementation work, unless you start without waiting. Research, junction and review tickets go on.
- **When a check fails on main**, implementation waits for your choice, on `main`'s bubble or its row in [Waiting on you](/docs/waiting-on-you/): **Fix main first** (agents wait until main passes), **Drop** the check for this trail, or **Start anyway** (the failure is known; a completion that fails only as main does isn't blamed for it). Agents tell you in one line and [wait for work](/docs/mcp-tools/#waiting-for-work).
- **When main moves after a failure**, the checks run again on the new head by themselves. Meanwhile `main` says "Main moved since the failing run: running again" and adds nothing to Waiting on you. A **Fix main first** or **Start anyway** you chose carries over to the new run.

**Run checks on main** in **Settings → Verification** runs them again whenever you like.

**Which commit.** Checks on main, the trail's combined run below and the revert check all read the same default-branch head: your local default branch, or `origin/<branch>` when it is ahead of it (as your clone last fetched it; Teamtrail fetches nothing). So the three never disagree about what main is.

## Trail verified together

Every ticket can pass on its own branch and the trail still break once they're merged together. So when every ticket in a trail is done and its work is on the default branch (the pull request's merge commit, or the verified commit when there was no pull request), Teamtrail runs the approved checks once more, automatically, on that commit (in [Cloud](/docs/cloud/), on its runner). It uses the same default-branch head as [checks on main](#checks-on-main), and reads reverts in that commit's history.

A trail is **verified** only when every ticket's proof is and that combined run passed. Otherwise it says why, for example:

- "waiting for PR #5 to merge"
- "#2 is reverted on main"
- "test fails on main at abc1234 after merging"

**Work that didn't land isn't the destination.** While a done ticket's pull request was closed without merging, or its work was reverted on the default branch, the trail isn't done: no flag at the destination and no Destination reached ("The work hasn't landed: #3 closed without merging"). It is done again once that work reaches the default branch, for example through a replacement pull request.

**When it fails**, an item lands in [Waiting on you](/docs/waiting-on-you/) ("Trail checks fail on main after merging #2, #3"), the destination flag on the map turns red, and Destination reached offers **See what fails**. The flag's bubble shows the output, with **Add a fix ticket** and **Run again**. **When it passes**, the trail says "Verified together on main at abc1234".

Before everything is merged, **Run now on main as it is** in the flag bubble's ⋯ menu runs the checks on the default branch as it stands, to catch trouble early. That run never counts toward the trail being verified.

The trail's proof lists every ticket's proof and the combined run: `teamtrail proof --trail <trail>`, or [`proof_report`](/docs/mcp-tools/#working-and-completing) with `wholeTrail: true`.

## What came back

A ticket came back when its work was verified and later reopened (read from the journal) or reverted on the default branch (a `This reverts commit` commit, including merge commits and squashed or merged pull requests).

The [scorecard](/docs/trail-stats/#scorecard) gives every row a came-back count and rate, with a **By type** view and a **Came back** view per check that passed, so you can see which checks let bad work through. Each ticket that came back is also an item in [Waiting on you](/docs/waiting-on-you/) ("#7 was verified, then reverted: add a rule?", chip **Came back**), which opens the [Diff rules](#diff-rules) editor filled in with the changed folders and the reason.

## Verified by Teamtrail

Every completed ticket can carry a report of what Teamtrail recorded, for the pull request that ships it:

- the checks Teamtrail ran itself (command, exit code, duration), not what the agent says it ran;
- each acceptance criterion and its evidence: verified by Teamtrail (`check:` evidence) or only claimed by the agent;
- the git range (base → head, files changed) and any flags;
- the scope: whether every change stayed inside the files the agent declared, or which didn't;
- the review: who reviewed it, their verdict, whether the reviewer was independent of the author, and the author's and the reviewer's models;
- what the [gates](#gates-off-observe-enforce) found: a change to what the checks run or a pass on retry, and who accepted it; the diff rules that applied, their checks and the answers (shown as claimed);
- the decisions the work relies on, on the ticket and on the tickets it was blocked by, each with who made the call, by name: git's `user.name` on the machine where you decided, or the person signed in to a hosted Lookout.

The report opens with a badge, **Teamtrail verified** or **Teamtrail not verified**. A ticket is verified when its latest attempt passed everything its [level](#verification-levels) asks: the checks passed, no criterion is missing or failed and you confirmed the criteria, plus an independent review at `checks+review`, plus your approval at `checks+review+human`, and no enforced gate holds it. A pass you accepted past the check guard or the flaky gate counts, and the report says who accepted it; a same-model review under an enforced `independent-review` never does. Otherwise the report lists what's missing, one line each, and the Lookout says who closes each: see [Done means verified](#done-means-verified). A completion from a [remote agent](/docs/remote-agents/) is never verified here, because no check ran on this machine.

**Getting the report.** Run [`teamtrail proof <ticket>`](/docs/cli/#teamtrail-proof), or let the agent call [`proof_report`](/docs/mcp-tools/#working-and-completing): agents are told to put it in the pull request description unchanged when they open one. In the Lookout, the ticket's **Full ticket** shows it too, with **Copy for PR**.

**Posted for you.** Switch on **Settings → Project → Proof on pull requests** and, when a ticket is done and its pull request is open, Teamtrail posts the report as one comment on the PR (updated in place, never repeated) and sets a **Teamtrail proof** check next to CI. The check passes only when the ticket is verified at the PR's latest commit. It's off by default and set per machine: each person's Lookout posts with their own GitHub token, to the repo Teamtrail syncs pull requests with (`github` in [verification.json](/docs/verification-json/)). A post that fails (offline, a rate limit) is tried again on the next sync.

- A pull request that merged before PR sync ever saw it open still gets its proof, once.
- A ticket reopened after its proof was posted takes the proof back: the comment is updated to **not verified** (the ticket isn't done any more) and the **Teamtrail proof** check turns to failure.
- A ticket (or trail) removed after its proof was posted takes it back too, once: the check turns to failure ("The ticket this proof was for was removed") and the comment says it's no longer verified.
- A proof that names no commit never passes: the check fails ("The proof names no commit"), and so does `teamtrail proof verify`.

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

Before working a `task`, `execute` or `prototype` ticket, the agent calls `set_criteria`: numbered points (`AC-1`, `AC-2`, …), each with a kind (`unit`, `integration`, `e2e`, `regression`, `business-rule`, `security`, `manual`) and optionally the knowledge entry it comes from. Criteria are required on trails with a discovery brief, unless verification is `off`. Business rules from [project knowledge](/docs/discovery-and-knowledge/) are suggested as criteria, and the ticket's bubble on the map shows rules no criterion covers yet.

You confirm a ticket's criteria in its **Full ticket**, from its row in Hands-off's **Needs you**, or all of a trail's at once with [Approve the plan](/docs/hands-off/#approve-the-plan). Confirming is bound to the criteria as the page showed them. Criteria charted with a ticket are confirmed before any agent starts it; once confirmed, an agent's change is only a proposal until you take it, and its completion is checked against the confirmed ones. See [Done means verified](#done-means-verified).

When completing, the agent gives evidence for each criterion:

| Evidence        | Means                                                       |
| --------------- | ----------------------------------------------------------- |
| `check:<name>`  | A check from `verification.json` that passed.               |
| `test:<name>`   | A named test.                                               |
| `command:<cmd>` | A command that was run.                                     |
| `pr`            | The pull request.                                           |
| `manual`        | Only you can confirm it: it comes to your list to sign off. |

A criterion without evidence, or whose check failed, sends the work back with the reason. Criteria are stored in `criteria/<trail>.md`.
