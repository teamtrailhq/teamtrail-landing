# Personal settings

Your own preferences and tokens, and what you approved, kept in your config folder on your machine and never in the repo.

## The config folder

| Platform     | Path                                                      |
| ------------ | --------------------------------------------------------- |
| macOS, Linux | `~/.config/teamtrail/` (or `$XDG_CONFIG_HOME/teamtrail/`) |
| Windows      | `%APPDATA%\teamtrail\`                                    |
| Any          | `$TEAMTRAIL_CONFIG_DIR`, when set, wins                   |

| File               | Holds                                                                                                                                                                                                                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `attention.json`   | Your notification channel, quiet hours and focus mode.                                                                                                                                                                                                                                                                                        |
| `credentials.json` | GitHub, Linear and Slack tokens, and the token from [Sign in with GitHub](/docs/trackers/#sign-in-with-github), written with mode `0600`.                                                                                                                                                                                                     |
| `slack.json`       | Slack settings and setup progress (no secrets).                                                                                                                                                                                                                                                                                               |
| `machine.key`      | This machine's secret, which signs your answers, approvals and trail state. Written with mode `0600`. Keep agents from reading it: see [Keep agents out of the config folder](/docs/connect-your-agent/#keep-agents-out-of-the-config-folder).                                                                                                |
| `projects/<id>/`   | What this machine trusts about one repo: your [approvals](/docs/security/), the signed record of each trail's state, the browsers [signed in](/docs/sign-in/) to its Lookout, the tracker you picked and the settings you accepted, and tracker writes queued while offline. A repo moved to another folder gets a new id and is asked again. |
| `projects.json`    | The repos [All projects](/docs/all-projects/) shows, and whether agents add their repo when they connect. See [File formats](/docs/file-formats/#projects-registry-projectsjson-config-folder).                                                                                                                                               |

## attention.json (personal)

Set in **Settings → Attention** or by hand. The [focus control](#focus-in-the-header) in the header writes `focusUntil` and `focusOffUntil`.

```json
{
  "v": 1,
  "channel": "browser",
  "focus": { "from": "09:00", "to": "12:00", "days": [1, 2, 3, 4, 5] }
}
```

| Key             | Type                                                 | Default   |                                                                                                                                                     |
| --------------- | ---------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v`             | `1`                                                  |           | File format version.                                                                                                                                |
| `channel`       | `browser` \| `slack-dm` \| `slack-channel` \| `none` | `browser` | Where interrupting items go. `none` sends everything to the digest.                                                                                 |
| `focus`         | `{ from, to, days? }`                                | none      | Daily quiet hours, `HH:MM` in your local time. `to` before `from` spans midnight. `days` are `0` (Sunday) to `6` (Saturday); without it, every day. |
| `focusUntil`    | epoch milliseconds                                   | none      | Focus mode until this time.                                                                                                                         |
| `focusOffUntil` | epoch milliseconds                                   | none      | Quiet hours paused until this time, after **End focus now** during them.                                                                            |

During focus mode and quiet hours nothing interrupts you; the list in **Waiting on you** keeps updating. Browser notifications need your permission, asked when you pick the browser channel. Choosing the browser doesn't turn off Slack interrupts; only `none` does.

## Focus in the header

The header always shows whether focus is on:

| It says                        | Meaning                                                                   |
| ------------------------------ | ------------------------------------------------------------------------- |
| **Focus on · until 12:00**     | Focus is on, switched on here or by your quiet hours, until that time.    |
| **Focus paused · until 12:00** | You ended focus during your quiet hours; they hold again after that time. |
| **Focus off**                  | Interrupting items notify you.                                            |

Click it to see why focus is on or off and how many items it holds back, and to change it:

- **Focus for 1 hour** or **Focus for 3 hours**, while it's off.
- **End focus now**, while it's on, even during your quiet hours. They then pause until they would have ended.
- **Resume quiet hours** or **Focus for 1 hour**, while they're paused.
- **Quiet hours** opens **Settings → Attention**, where you set them.

Focus is yours: it's kept in your `attention.json` on this machine, never in the repo, so a teammate's focus never changes yours.

The team's threshold and weights are in the repo: [attention.json](/docs/attention-json/).

## credentials.json

Written by the Lookout when you save a token in Settings. You can also skip it and use environment variables: see [GitHub Issues and Linear](/docs/trackers/), [Slack](/docs/slack/) and [Environment variables](/docs/environment-variables/).
