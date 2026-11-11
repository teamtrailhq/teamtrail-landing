# Slack

Get urgent agent questions, approvals and trail updates in Slack, through your own Scout app.

You create the app in your own Slack workspace. It runs from your machine over Socket Mode, so nothing goes through Teamtrail. One-click **Add to Slack** is coming with Teamtrail Cloud.

## Set up

```bash
teamtrail connect slack
```

This starts the Lookout on the Slack setup (also **Settings → Attention & alerts → Slack**). Each step says what you do in Slack and why:

1. **Create your app**: Slack opens filled in from a manifest, with the `/scout` command, **Save as decision** and Socket Mode, so no public URL is needed.
2. **Workspace**: pick the workspace your app lives in.
3. **App token**: generate an app-level token (`xapp-…`) with `connections:write`, so Scout can connect from this machine, and paste it.
4. **Install**: install the app to your workspace and paste its bot token (`xoxb-…`), so Scout can post and DM you.
5. **Owner**: show Scout which Slack account is yours. Press **Get a code** in the Lookout, then in Slack open Scout's **Home** tab → **Enter code** and type it. The code works once, for 10 minutes. Back in the Lookout, check the account that entered it (its handle, name and workspace, and whether its Slack email is your git email) and press **Yes, this is me**, or **Not me** to start over.

**Nothing is sent in Slack, and nobody can act from it, until you confirm the owner.** Only the confirmed owner's buttons count. Getting a code, confirming and resetting the owner are done on the machine Teamtrail runs on, and recorded in the project's journal.

Then pick who may use it and where notifications go.

Tokens are saved in your [config folder](/docs/personal-settings/) (`credentials.json`, mode `0600`), or read from `$TEAMTRAIL_SLACK_APP_TOKEN` and `$TEAMTRAIL_SLACK_BOT_TOKEN`. Only one `teamtrail` process at a time holds the Socket Mode connection.

The app asks for these bot scopes: `commands`, `chat:write`, `im:write`, `channels:history`, `groups:history`, `im:history`, `mpim:history`, `users:read`, and optionally `users:read.email` (to show whether the account that entered the code has your git email; a hint only).

## What it does

- **Questions:** an interrupting question becomes its own message with answer buttons. Others go into the trail's digest as a line, to answer in Teamtrail. With channel `none`, everything goes to the digest.
- **Digest:** everything that doesn't interrupt goes out as one message per trail every `digestMinutes` from [attention.json](/docs/attention-json/) (default 60; the first one for a trail goes out right away). `0` turns digest messages off; Waiting on you still has everything. See [Waiting on you](/docs/waiting-on-you/).
- **Approvals:** sign off verified work from Slack.
- **Requests:** an agent's request to skip discovery or change a trail's mode or destination comes as a card with **Approve** and **Decline**.
- **Notifications:** to a DM or a channel, for the events you pick: `awaiting`, `blocked`, `trail.done` (default) and `resolved`, with full detail or titles only.
- **`/scout` slash command:** `decide [text]`, `status [trail]`, `inbox`, `help`.
- **Save as decision:** a message shortcut that records a thread as a decision.

## Settings

Change notifications, allowed people and the target in the Lookout's Slack settings. They're stored in `slack.json` in your config folder. Per repo, `.teamtrail/.agents/slack.json` tracks which Slack message carries which agent question.
