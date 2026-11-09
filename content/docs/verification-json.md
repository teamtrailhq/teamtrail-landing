# verification.json

The checks that run when an agent claims a ticket is done, committed in `.teamtrail/verification.json`.

Without this file, nothing is verified. The file comes from your repo, so no agent can change what verifies its own work. Teamtrail only writes to it when you approve a check a [guide](/docs/guides/) proposes.

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

| Key               | Type                     | Default               |                                                                                                                  |
| ----------------- | ------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `v`               | `1`                      | required              | File format version.                                                                                             |
| `default`         | level                    | `"checks"`            | Level new trails start at: `off`, `checks`, `checks+review`, `checks+review+human`. Existing trails keep theirs. |
| `appliesTo`       | ticket types             | `["execute", "task"]` | Ticket types the trail level applies to: `research`, `prototype`, `junction`, `task`, `execute`.                 |
| `checks`          | object                   | `{}`                  | Named checks (below).                                                                                            |
| `run`             | check names              | `[]`                  | Checks to run, in order. Each must be defined in `checks`. A ticket can list its own instead.                    |
| `failFast`        | boolean                  | `true`                | Stop at the first failing check.                                                                                 |
| `maxAttempts`     | positive integer         | `3`                   | Failed attempts before the ticket waits for you (`blocked`).                                                     |
| `totalTimeoutSec` | positive integer         | `1800`                | Time limit for all checks of one attempt.                                                                        |
| `noChanges`       | object                   | see below             | What a completion with no code changes means.                                                                    |
| `stale`           | `"reverify"` \| `"flag"` | `"reverify"`          | When the code or this file changed since the checks ran: run them again, or flag the result.                     |
| `github`          | object                   | see below             | Pull request and CI tracking.                                                                                    |

### A check

| Key          | Type             | Default   |                                                                                                    |
| ------------ | ---------------- | --------- | -------------------------------------------------------------------------------------------------- |
| `run`        | string array     | required  | The command as argv, for example `["npm", "test"]`. A shell string is an error: there is no shell. |
| `timeoutSec` | positive integer | `600`     | Time limit for this check.                                                                         |
| `cwd`        | path             | repo root | Working directory, relative to the repo root. It must stay inside the repo.                        |

Checks run without your tokens in their environment, and token-shaped output is redacted. With [workspaces](/docs/parallel-work/) on, a ticket's checks run in its worktree.

### noChanges

| Key     | Default                                 |                                                                                                                                   |
| ------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `allow` | `["research", "junction", "prototype"]` | Ticket types that may complete without code changes.                                                                              |
| `else`  | `"flag"`                                | Any other type with no changes: `flag` it, `fail` the attempt, or send it to a `human`. An agent can explain with `noCodeReason`. |

### github

| Key              | Default  |                                                                               |
| ---------------- | -------- | ----------------------------------------------------------------------------- |
| `enabled`        | `"auto"` | Track pull requests and CI when the project is on GitHub; `"off"` to disable. |
| `requiredChecks` | `[]`     | CI check names that must pass.                                                |
| `pollSec`        | `60`     | How often to poll, at least `15`.                                             |

## Errors

The file is validated as a whole and every problem is listed in **Settings → Verification**. Until it's valid, a completion that needs checks ends with an error and waits for you: running no checks would let unchecked work through. Unknown keys are errors. Examples:

```text
"run" names unknown check "lint"
checks.test.run must be an argv array, not a shell string
"github.pollSec" must be an integer of at least 15
```

See [Verification and criteria](/docs/verification/) for how checks fit into completion.
