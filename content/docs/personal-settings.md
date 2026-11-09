# Personal settings

Your own preferences and tokens, kept in your config folder on your machine and never in the repo.

## The config folder

| Platform     | Path                                                      |
| ------------ | --------------------------------------------------------- |
| macOS, Linux | `~/.config/teamtrail/` (or `$XDG_CONFIG_HOME/teamtrail/`) |
| Windows      | `%APPDATA%\teamtrail\`                                    |
| Any          | `$TEAMTRAIL_CONFIG_DIR`, when set, wins                   |

| File               | Holds                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `attention.json`   | Your notification channel, quiet hours and focus mode.                                                                                                                                          |
| `credentials.json` | GitHub, Linear and Slack tokens, written with mode `0600`.                                                                                                                                      |
| `slack.json`       | Slack settings and setup progress (no secrets).                                                                                                                                                 |
| `projects.json`    | The repos [All projects](/docs/all-projects/) shows, and whether agents add their repo when they connect. See [File formats](/docs/file-formats/#projects-registry-projectsjson-config-folder). |

## attention.json (personal)

Set in **Settings → Attention** or by hand. Focus mode from the header writes `focusUntil`.

```json
{
  "v": 1,
  "channel": "browser",
  "focus": { "from": "09:00", "to": "12:00", "days": [1, 2, 3, 4, 5] }
}
```

| Key          | Type                                                 | Default   |                                                                                                                                                     |
| ------------ | ---------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v`          | `1`                                                  |           | File format version.                                                                                                                                |
| `channel`    | `browser` \| `slack-dm` \| `slack-channel` \| `none` | `browser` | Where interrupting items go. `none` sends everything to the digest.                                                                                 |
| `focus`      | `{ from, to, days? }`                                | none      | Daily quiet hours, `HH:MM` in your local time. `to` before `from` spans midnight. `days` are `0` (Sunday) to `6` (Saturday); without it, every day. |
| `focusUntil` | epoch milliseconds                                   | none      | Focus mode until this time.                                                                                                                         |

During focus mode and quiet hours nothing interrupts you; the list in **Waiting on you** keeps updating. Browser notifications need your permission, asked when you pick the browser channel. Choosing the browser doesn't turn off Slack interrupts; only `none` does.

The team's threshold and weights are in the repo: [attention.json](/docs/attention-json/).

## credentials.json

Written by the Lookout when you save a token in Settings. You can also skip it and use environment variables: see [GitHub Issues and Linear](/docs/trackers/), [Slack](/docs/slack/) and [Environment variables](/docs/environment-variables/).
