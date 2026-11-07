# Slack

Get urgent agent questions, approvals and trail updates in Slack, through your own Slack app running from your machine.

## Set up

```bash
teamtrail connect slack
```

This starts the Lookout on the Slack setup. It walks you through:

1. creating your own Slack app from a manifest (Socket Mode, so no public URL is needed);
2. pasting its app-level token (`xapp-…`) and bot token (`xoxb-…`);
3. picking who may use it and where notifications go.

Tokens are saved in your [config folder](/docs/personal-settings/) (`credentials.json`, mode `0600`), or read from `$TEAMTRAIL_SLACK_APP_TOKEN` and `$TEAMTRAIL_SLACK_BOT_TOKEN`. Only one `teamtrail` process at a time holds the Socket Mode connection.

The app asks for these bot scopes: `commands`, `chat:write`, `im:write`, `channels:history`, `groups:history`, `im:history`, `mpim:history`, `users:read`, and optionally `users:read.email` (to recognise you by your git email).

## What it does

- **Questions:** an interrupting question becomes its own message with answer buttons. Others go into the trail's digest as a line, to answer in Teamtrail. With channel `none`, everything goes to the digest.
- **Digest:** everything that doesn't interrupt goes out as one message per trail every `digestMinutes` from [attention.json](/docs/attention-json/) (default 60; the first one for a trail goes out right away). `0` turns digest messages off; Waiting on you still has everything. See [Waiting on you](/docs/waiting-on-you/).
- **Approvals:** sign off verified work from Slack.
- **Notifications:** to a DM or a channel, for the events you pick: `awaiting`, `blocked`, `trail.done` (default) and `resolved`, with full detail or titles only.
- **`/scout` slash command:** `decide [text]`, `status [trail]`, `inbox`, `help`.
- **Save as decision:** a message shortcut that records a thread as a decision.

## Settings

Change notifications, allowed people and the target in the Lookout's Slack settings. They're stored in `slack.json` in your config folder. Per repo, `.teamtrail/.agents/slack.json` tracks which Slack message carries which agent question.
