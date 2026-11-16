# attention.json

The team's rules for ranking and interruptions, committed in `.teamtrail/attention.json`.

Without the file, the defaults apply. Personal choices (channel, quiet hours) live elsewhere: see [Personal settings](/docs/personal-settings/).

## Example

```json
{
  "v": 1,
  "interrupt": 70,
  "digestMinutes": 120,
  "reviewLimit": 5,
  "weights": {
    "knowledge": 20,
    "policy": 70
  }
}
```

## Keys

| Key             | Type                   | Default   |                                                                                                                                                                                                             |
| --------------- | ---------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v`             | `1`                    | required  | File format version.                                                                                                                                                                                        |
| `interrupt`     | number 0–200           | `70`      | Items scoring at or above this notify actively; the rest wait in the list and the digest.                                                                                                                   |
| `digestMinutes` | minutes 0–10080        | `60`      | How often Slack sends each trail's digest of non-urgent items, re-read live; `0` turns it off.                                                                                                              |
| `weights`       | object of kind → 0–100 | see below | How much each kind counts. Kinds you leave out keep their default.                                                                                                                                          |
| `reviewLimit`   | whole number 1–50      | off       | How many finished tickets may wait for review before agents start no new implementation work. `null` or left out is off. See [Review capacity](/docs/review-capacity/). Set it in **Settings → Attention**. |

### Default weights

| Kind           | Weight | Kind                | Weight |
| -------------- | ------ | ------------------- | ------ |
| `question`     | 60     | `guide`             | 45     |
| `blocked`      | 60     | `stalled`           | 40     |
| `reroute`      | 60     | `overlap`           | 40     |
| `brief`        | 55     | `precedent`         | 40     |
| `trust`        | 55     | `tracker-settings`  | 40     |
| `review-limit` | 55     | `hitl-ready`        | 35     |
| `approval`     | 50     | `flag`              | 35     |
| `policy`       | 50     | `reroute-suggested` | 30     |
| `integration`  | 45     | `model`             | 30     |
|                |        | `guide-checks`      | 30     |
|                |        | `knowledge`         | 15     |
|                |        | `delivery`          | 10     |

An item's score starts at half its kind's weight, then adds urgency, held tickets, an idle agent and age. With the defaults, a `blocking` question with an idle agent scores exactly 70, so it interrupts. See [Waiting on you](/docs/waiting-on-you/) for the full rules.

## Errors

A broken `attention.json` never stops the list: each bad value falls back to its default, and every problem is shown in **Settings → Attention**. (`policy.json` also falls back, to its strict defaults; `verification.json` doesn't, because running no checks would let unchecked work through.)

```text
unknown kind "chat" in "weights" (one of question, blocked, reroute, …)
"interrupt" must be a number from 0 to 200
"reviewLimit" must be a whole number from 1 to 50, or null (off)
```
