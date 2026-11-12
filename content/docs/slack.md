# Slack

Get urgent agent questions, approvals and trail updates in Slack, from Scout, Teamtrail's Slack app. Free, no account.

Slack can't reach your machine, so Scout works through the **Scout service**, a small service Teamtrail runs at `scout.teamtrail.app`. Your Teamtrail keeps one outbound connection to it. Your trails, decisions and approvals stay on your machine; see [What passes through the Scout service](#what-passes-through-the-scout-service).

## Connect

```bash
teamtrail connect slack
```

This starts the Lookout on **Settings → Slack** (also in the Lookout's Settings at any time). Then:

1. Choose **Add Scout to Slack**. Slack's own screen asks you to add Scout to your workspace. A workspace admin may have to approve the app once; after that, anyone in the workspace can connect their own Teamtrail the same way.
2. Slack sends you back to the Lookout, which asks **Connect as @you in _Workspace_?** Check it's your Slack account and choose **Connect**. Nothing is saved until you do; **Cancel** throws the link away.

The Slack account that went through Slack's screen is the **owner**: the person Scout talks to. Connecting starts on this machine's signed-in Lookout, and only the Lookout that started it can finish it, so nobody else can connect your Teamtrail to their Slack account. Connecting and disconnecting are recorded in the project's journal.

Then pick who else may act and where notifications go (see [Settings](#settings)).

The link to the Scout service is saved in your [config folder](/docs/personal-settings/) (`credentials.json`, mode `0600`). It's only ever sent to the service it was made with. Only one `teamtrail` process at a time holds the connection; another one says where Slack is connected.

**Disconnect** in Settings → Slack revokes the link at the Scout service and deletes it, and your Slack settings, from this machine. Uninstalling Scout from the workspace in Slack disconnects everyone in it.

If you set up your own Slack app with an earlier version, Settings → Slack asks you to **Add Scout to Slack again**. Your old app's tokens are deleted from this machine when you do, or when you remove Slack.

## What it does

- **Questions:** an interrupting question becomes its own message with answer buttons and **Reply…** for your own words. Others go into the trail's digest as a line, to answer in Teamtrail. With channel `none`, everything goes to the digest.
- **Digest:** everything that doesn't interrupt goes out as one message per trail every `digestMinutes` from [attention.json](/docs/attention-json/) (default 60; the first one for a trail goes out right away). `0` turns digest messages off; Waiting on you still has everything. See [Waiting on you](/docs/waiting-on-you/).
- **Approvals:** sign off verified work with **Approve**, or send it back with **Rework…**.
- **Requests:** an agent's request to skip discovery or change a trail's mode or destination comes as a card. Approve it in the Lookout (**Open in Lookout**); **Decline** works in Slack too.
- **Notifications:** to a DM or a channel, for the events you pick: `awaiting`, `blocked`, `trail.done` (default) and `resolved`, with full detail or titles only.
- **`/scout` slash command:** `decide [text]`, `status [trail]`, `inbox`, `help`. Replies only you can see; `inbox` links each item to the Lookout.
- **Save as decision:** a message shortcut that records a thread as a decision.
- **Home tab:** says whether Scout is connected for you, with a link to the Lookout.

## High-risk calls stay in the Lookout

A Slack answer reaches your machine through the Scout service, so it never stands in for you on the calls that matter most:

- A question asked with a category your [risk policy](/docs/policy-json/) rates **high**, or finished work that changed files a high-risk path rule matches, shows **Open in Lookout** in Slack instead of answer or approve buttons.
- An answer given in Slack never backs a high-risk decision, and Save as decision can't settle a high-risk ticket. Teamtrail checks this itself, whatever arrives from Slack.
- Approving an agent's request to change a trail's settings is done in the Lookout.

Everything else you answer or approve in Slack counts the same as in the Lookout.

## Who can act

Buttons count only for the owner and the people they allow in Settings → Slack, and only on messages your own Teamtrail posted. A click on a message another Teamtrail posted never reaches yours.

When your Teamtrail isn't running, Scout says so ("Your Teamtrail isn't running…") and does nothing. Nothing waits on the service to act for you later: start Teamtrail and try again.

## What passes through the Scout service

- **Passes through, in memory only:** the questions, answers, digests and approvals Scout posts, your clicks, `/scout` commands and the threads you save as decisions. The service doesn't store or log their text.
- **Stored by the service:** your workspace's bot token (encrypted), your Slack user and workspace ids, your link (a hash of its secret, never the secret), and for up to 30 days the ids of messages your Teamtrail posted, so clicks go back to it.
- **Never leaves your machine:** trails, tickets, decisions, approvals, evidence and the gates that decide what counts as your word.

See the [privacy policy](/privacy/) for retention and deletion, and [Security](/docs/security/#slack) for what this means for trust.

The app asks Slack for these bot scopes: `commands`, `chat:write`, `im:write`, `channels:history`, `groups:history`, `im:history`, `mpim:history` (to read a thread you save as a decision), `users:read`, and `channels:read` and `groups:read` (so Scout posts only to channels the owner is in).

## Settings

Change notifications, allowed people and the target in **Settings → Slack**. To post to a channel, invite @Scout there first; Scout posts only to channels the owner is a member of. Settings are stored in `slack.json` in your config folder. Per repo, `.teamtrail/.agents/slack.json` tracks which Slack message carries which agent question.

For development, `TEAMTRAIL_SCOUT_SERVICE` points Teamtrail at another Scout service (see [Environment variables](/docs/environment-variables/)).
