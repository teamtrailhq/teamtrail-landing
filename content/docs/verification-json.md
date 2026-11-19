# verification.json

The checks that run when an agent claims a ticket is done, committed in `.teamtrail/verification.json`.

Without this file, nothing is verified. Teamtrail writes to it when you set the checks or the scope in **Settings → Verification**, or the gates and diff rules in **Settings → This trail** (approved as you save), and when you approve a check a [guide](/docs/guides/) proposes.

**Its commands run only once you approve them on your machine.** An agent can edit this file and a teammate can push it, so a new or changed command waits in **Settings → Project → Approvals** (or `teamtrail approve`). Until then completions that need checks end with `waiting-approval`, and the work is kept. See [Approvals and security](/docs/security/#check-commands).

## Example

```json
{
  "v": 1,
  "default": "checks",
  "checks": {
    "typecheck": { "run": ["npm", "run", "typecheck"], "timeoutSec": 300 },
    "test": { "run": ["npm", "test"], "timeoutSec": 600 }
  },
  "run": ["typecheck", "test"]
}
```

## Keys

| Key               | Type                              | Default               |                                                                                                                                                                                                                             |
| ----------------- | --------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v`               | `1`                               | required              | File format version.                                                                                                                                                                                                        |
| `default`         | level                             | `"checks"`            | Level new trails start at: `off`, `checks`, `checks+review`, `checks+review+human`. Existing trails keep theirs.                                                                                                            |
| `appliesTo`       | ticket types                      | `["execute", "task"]` | Ticket types the trail level applies to: `research`, `prototype`, `junction`, `task`, `execute`.                                                                                                                            |
| `checks`          | object                            | `{}`                  | Named checks (below).                                                                                                                                                                                                       |
| `run`             | check names                       | `[]`                  | Checks to run, in order. Each must be defined in `checks`. A ticket can list its own instead.                                                                                                                               |
| `failFast`        | boolean                           | `true`                | Stop at the first failing check.                                                                                                                                                                                            |
| `maxAttempts`     | positive integer                  | `3`                   | Failed attempts before the ticket waits for you (`blocked`).                                                                                                                                                                |
| `totalTimeoutSec` | positive integer                  | `1800`                | Time limit for all checks of one attempt.                                                                                                                                                                                   |
| `noChanges`       | object                            | see below             | What a completion with no code changes means.                                                                                                                                                                               |
| `scope`           | `"flag"` \| `"fail"` \| `"human"` | `"flag"`              | Files changed outside the ones the agent declared at its claim (`touches`): show them to the reviewer, `fail` the attempt (rework), or send it to a `human`. See [Review capacity](/docs/review-capacity/#the-scope-check). |
| `stale`           | `"reverify"` \| `"flag"`          | `"reverify"`          | When the code or this file changed since the checks ran: run them again, or flag the result.                                                                                                                                |
| `github`          | object                            | see below             | Pull request and CI tracking.                                                                                                                                                                                               |
| `gates`           | object                            | see below             | The mode of each verification gate: `off`, `observe` or `enforce`.                                                                                                                                                          |
| `rules`           | array                             | `[]`                  | Diff rules: a check or a question for changes that touch certain files (below).                                                                                                                                             |
| `setup`           | object                            | none                  | Named installs Teamtrail runs before the checks in the worktrees it prepares (below).                                                                                                                                       |

### A check

| Key          | Type             | Default   |                                                                                                                                                            |
| ------------ | ---------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run`        | string array     | required  | The command as argv, for example `["npm", "test"]`. A shell string is an error: there is no shell.                                                         |
| `timeoutSec` | positive integer | `600`     | Time limit for this check.                                                                                                                                 |
| `cwd`        | path             | repo root | Working directory, relative to the repo root. It must stay inside the repo.                                                                                |
| `guards`     | glob array       | `[]`      | Globs the [check guard](/docs/verification/#check-guard) also watches for this check, beyond the scripts, tool config and files it finds from the command. |

Checks run with an allowlisted environment: the shell, locale and toolchain basics, without tokens, keys or anything named like a secret. Name extra variables a check needs in `TEAMTRAIL_CHECK_ENV` on your machine, never in the repo:

```bash
TEAMTRAIL_CHECK_ENV="DATABASE_URL, REDIS_URL, APP_*" teamtrail
```

Token-shaped output is redacted. With [workspaces](/docs/parallel-work/) on, a ticket's checks run in its worktree.

Checks run as you, without a sandbox: they can read what your account can read. Approval covers the command line, not what it runs (`npm run check` runs `package.json` scripts an agent can edit).

### setup

Installs from your lockfile, run before the checks in the worktrees Teamtrail prepares: the one [checks on main](/docs/verification/#checks-on-main) run in, and a claimed ticket's new [worktree](/docs/parallel-work/). Never in your own checkout. In a monorepo, give each folder with its own lockfile a step.

```json
"setup": {
  "web": { "run": ["npm", "ci"], "cwd": "apps/web" },
  "api": { "run": ["uv", "sync", "--frozen"], "cwd": "services/api" }
}
```

| Key          | Type             | Default   |                                                                         |
| ------------ | ---------------- | --------- | ----------------------------------------------------------------------- |
| `run`        | string array     | required  | The install as argv. A shell string is an error.                        |
| `cwd`        | path             | repo root | Where it runs, relative to the repo root. It must stay inside the repo. |
| `timeoutSec` | positive integer | `900`     | Time limit for this step.                                               |

Steps run in the order written, are approved with the checks (the approval shows each as `setup <name>` with its argv), and stop at the first that fails. Teamtrail runs only installs that can't change the lockfile or add a package, and only when the lockfile is in the step's folder on that commit: `npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable` (or `--frozen-lockfile`), `bun install --frozen-lockfile`, `uv sync --frozen` (or `--locked`), `poetry install` or `poetry sync`, `bundle install --frozen`, `go mod download`, `cargo fetch --locked`, `composer install --no-interaction`, `dotnet restore --locked-mode`. Anything else (`npm install`, a package name, a URL, a shell) isn't run: the approval flags it, and the run says why.

When a step fails, checks on main say **Checks on main couldn't run on this machine** and hold nothing; a ticket's agent is told to install in its worktree itself. Install output is logged next to the checks' and is never a check result.

### noChanges

| Key     | Default                                 |                                                                                                                                   |
| ------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `allow` | `["research", "junction", "prototype"]` | Ticket types that may complete without code changes.                                                                              |
| `else`  | `"flag"`                                | Any other type with no changes: `flag` it, `fail` the attempt, or send it to a `human`. An agent can explain with `noCodeReason`. |

### gates

| Key                  | Default     |                                                                                               |
| -------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `check-guard`        | `"enforce"` | A pass where the work changed what its checks run, or weakened the tests.                     |
| `flaky`              | `"enforce"` | A check that passed only on retry, with the same command, commit and uncommitted changes.     |
| `diff-rules`         | `"enforce"` | A completion that touched a rule's files without passing its check or answering its question. |
| `independent-review` | `"observe"` | A review by an agent on the same model as the work's author.                                  |

Each is `"off"`, `"observe"` (record what it would hold, let the work through) or `"enforce"` (hold it for you). **Settings → This trail → Gates** writes this key and approves it in one step, on the machine Teamtrail runs on. A mode lowered in the file by hand waits for your approval, like a changed check command. See [Gates](/docs/verification/#gates-off-observe-enforce).

```json
"gates": { "check-guard": "enforce", "flaky": "enforce", "diff-rules": "enforce", "independent-review": "observe" }
```

### rules

Up to 50 rules. Each:

| Key     | Type       |                                                                                     |
| ------- | ---------- | ----------------------------------------------------------------------------------- |
| `id`    | string     | `R-<n>`. A rule added in Settings gets the next one.                                |
| `when`  | glob array | Required, 1 to 20 globs. The rule applies only when the change touched one of them. |
| `check` | check name | A check from `checks` to run. Give `check`, `ask` or both.                          |
| `ask`   | string     | A question the agent answers in `ruleAnswers` on its completion.                    |
| `why`   | string     | The incident behind the rule, shown to the agent and to you.                        |

```json
"rules": [
  { "id": "R-1", "when": ["db/migrations/**"], "check": "migrate-roundtrip", "why": "A migration without a down step broke the rollback." }
]
```

Manage them in **Settings → This trail → Diff rules**. See [Diff rules](/docs/verification/#diff-rules).

### github

| Key              | Default  |                                                                               |
| ---------------- | -------- | ----------------------------------------------------------------------------- |
| `enabled`        | `"auto"` | Track pull requests and CI when the project is on GitHub; `"off"` to disable. |
| `requiredChecks` | `[]`     | CI check names that must pass.                                                |
| `pollSec`        | `60`     | How often to poll, at least `15`.                                             |

Merged and closed pull requests, and branches with no pull request, are asked about at most once an hour, so PR sync asks GitHub less as your history grows. A ticket follows the pull request that replaced one closed without merging, on the same branch or with the ticket's marker. See [Done means verified](/docs/verification/#done-means-verified).

## Errors

The file is validated as a whole and every problem is listed in **Settings → Verification**. Until it's valid, a completion that needs checks ends with an error and waits for you: running no checks would let unchecked work through. Unknown keys are errors. Examples:

```text
"run" names unknown check "lint"
checks.test.run must be an argv array, not a shell string
"scope" must be flag, fail or human
"github.pollSec" must be an integer of at least 15
```

See [Verification and criteria](/docs/verification/) for how checks fit into completion.
