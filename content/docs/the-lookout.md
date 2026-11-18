# The Lookout

The web app `teamtrail` serves on your machine, at `http://127.0.0.1:7420/`, where you steer your trails. It opens only in browsers you've paired; `teamtrail` opens yours ready to sign in: see [Sign in to the Lookout](/docs/sign-in/). It opens on the repo you started it in, and can supervise your other repos too ([All projects](/docs/all-projects/)). This is what's in it and where to find it.

## Hands-off and Hands-on

The Lookout has two modes, per person, switched in the header or in **Settings → You**:

- **Hands-off**, everyone's default: a calm home in place of the map. **Needs you** is a compact list, most urgent first, where you answer, approve and confirm in place; **Progress** shows the trail at a glance and the agents at work; **Since you were away** lists the decisions agents made themselves (keep or overrule each), changes to the plan and finished work. One step approves a whole plan: the brief and every ticket's criteria.
- **Hands-on**: the map and every view, described below.

The mode changes what you see, never what agents may decide or how work is verified. See [Hands-off and Hands-on](/docs/hands-off/).

## The map

In Hands-on, the trail map fills the page, between the bar of views and the trail bar. Every ticket is a card on the trail, joined to what it blocks: a chain of tickets runs in a straight line from `main` to the destination, a review sits beside the ticket it reviews, and a trail with many tickets side by side lays them out in a grid, in order of number. A `main` marker at the start shows the checks on your main branch. Drag to pan, scroll or pinch to zoom, and **Fit** shows the whole trail. **Legend** explains the cards.

The Lookout opens on what needs you, most urgent first, with its bubble already open. A discovery brief or a proposed reroute shows as a banner over the map.

A card shows how its ticket stands, live:

| Card                   | What it means                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Waiting for an agent   | Ready, and nobody has claimed it yet. A dashed border moves slowly round it, and it says how long it has waited.                                                   |
| An agent is on it      | The agent's name and the model it runs on (when the card has room), with its step out of five. A dot pulses and a thin bar along the top fills as the steps go by. |
| Needs you              | Red, with a slow halo: a question, an approval or something else only you can do.                                                                                  |
| Waits on #22, #8       | Blocked by those tickets. "Waits on your #6" means one that needs you holds it up.                                                                                 |
| Done                   | Done and verified, or done and not verified, with a PR chip for its pull request when the card has room. Ruled-out tickets are struck through.                     |
| Needs a stronger model | With [model matching](/docs/model-matching/) on, no connected agent runs a model strong enough for it.                                                             |

Nothing moves when your system asks for reduced motion.

## The bubble

Click a card, or `main`, and a bubble opens beside it. It starts with what the ticket needs from you, with the actions right there: answer the agent's question (its suggested replies or your own words), approve finished work, unblock it, release it to the queue, resolve it. **The whole conversation** opens the agent's chat on the Activity page. On `main`, the bubble offers **Fix main first**, **Drop** or **Start anyway** when its checks fail.

Under that is the ticket, written as its agent wrote it (lists, bold, code and links), always in the same shape: its title and chips (state, agent and model, verified, risk), its pull request when it has one (its state, its checks, and whether it is at the commit the proof covers), then **What**, **Acceptance criteria**, **How**, **Progress**, **Proof** and **History**, with its actions at the end. A ticket that needs you says so in red, says what is asked, and its first button does it. **Full ticket** opens the same ticket in a drawer, with everything: comments, attempts, the [proof](/docs/verification/#done-means-verified) with each gap and who closes it, its [guides](/docs/guides/) and checklist answers, checks, the workspace, and editing. In the night theme the ticket and menus sit on a raised sheet over the map.

**×**, **Esc** or a click on the empty map closes the bubble.

## The trail bar

Under the map, one line sums up the trail: a segment per ticket (click one to open it), the counts in words, such as **5 of 13 done · 2 working · 3 need you · 1 waiting for an agent**, and a chip for each thing that needs you.

**More** opens three lists under it, and the Lookout remembers your choice in this browser:

| List           | What's in it                                                                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Needs you      | This trail's [ranked list](/docs/waiting-on-you/), with **Later** to snooze, then what waits on your other trails. Items that aren't a ticket (a brief, a reroute, an approval) open their own dialog or page. |
| Agents at work | Each agent with its model, its ticket, its step and a short step bar, and **Chat**.                                                                                                                            |
| Up next        | The tickets waiting for an agent, longest waiting first, then those that wait on something of yours.                                                                                                           |

**Less** folds them away.

## The header

| Control              | What it does                                                                                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo name            | With more than one project, switch projects or open **All projects**. A badge counts what interrupts in your other projects.                                                                                                                        |
| Trail title          | Switch trails, or start a new one. Its menu also switches the trail between plan only and plan and build, starts it over, archives it, or restores an archived one: see [Archive and Start over](/docs/trails-and-tickets/#archive-and-start-over). |
| Spent                | The trail's model spend and tokens, on a wide window. It's also on the Activity page and in [Trail stats](/docs/trail-stats/).                                                                                                                      |
| Hands-off · Hands-on | Your mode: the home of what needs you, or the map and every view. See [Hands-off and Hands-on](/docs/hands-off/).                                                                                                                                   |
| Focus                | Whether focus is on (**Focus on · until 12:00**, **Focus paused** or **Focus off**). Click it to focus for a while or end it. See [Focus in the header](/docs/personal-settings/#focus-in-the-header).                                              |
| N need you           | How many things on this trail need you. Click it to open the most urgent. When things wait only on other trails, it says **On other trails** instead.                                                                                               |
| Records              | **Trip report** (Scout's summary of what happened while you were away), **Field guide** (what agents know about your code and product: see [Discovery and knowledge](/docs/discovery-and-knowledge/)) and **[Trail stats](/docs/trail-stats/)**.    |
| Settings             | Opens the Settings page. See [Settings](#settings) below.                                                                                                                                                                                           |
| Sun or moon          | Switch between the day and night themes.                                                                                                                                                                                                            |

In Hands-off the header leaves out the trail's readouts and counts: the home lists what needs you and the progress.

## The pages

In Hands-on, **Map · Plan · Activity · Logbook** sit in a bar of their own under the header. Plan, Activity and the Logbook are pages over the map; the browser's Back returns to the map.

| Page     | What it's for                                                                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan     | The plan's tabs (Not yet specified, Assumptions, Decisions, Out of scope, Notes and Report) beside the trail at a glance: its phase, the checks on main, what waits on you, the agents and what's ready next, and the mix of statuses and ticket types. |
| Activity | What each agent is doing, step by step, with its model (and its tier, with [model matching](/docs/model-matching/) on), everything that happened on the trail, newest first, and the conversation with an agent.                                        |
| Logbook  | Every decision across your trails, with its reasoning and who made each call, by name. **By area** groups them by folder or risk category, the most cited first. See [Decision memory](/docs/decision-memory/).                                         |

Each page has its own address (`?view=plan`, `?view=activity`, `?view=logbook`).

## On a phone

In Hands-off, the home is the one view: Needs you, Progress and Since you were away, one under the other. In Hands-on, the same layout as on a computer, narrower: the map, the bubble as a sheet under it, and the trail bar with its lists. The tab bar at the bottom holds Map, Plan, Activity and Logbook.

## All projects

Open it from the repo name in the header. One **Needs you** list across your repos, where you can answer an agent's question in any of them, one row per project, and **While you were away** across projects. See [All projects](/docs/all-projects/).

## Settings

**Settings** in the header opens a full page, with the groups in a side nav and one group at a time on the right. **Esc** or **Back to the Lookout** returns to the home or the map. Each section can be linked to directly: `?settings=<section>`, for example `?settings=tracker`, `?settings=models` or `?settings=guides`. Each section says where it's saved: committed to the repo, only on this machine, or only in this browser.

| Group              | Sections                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| This trail         | **Trail mode** (plan only, or plan and build), **Verification** (the [level](/docs/verification/), the checks in `verification.json`, and what a change outside the declared files does: the [scope check](/docs/review-capacity/#the-scope-check)), **[Model matching](/docs/model-matching/)** and **Team** (the guides the trail's tickets use; with Reviewer on the team, review tickets get the reviewer guide).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Project            | **Approvals** (what the repo asks this machine to trust: see [Approvals and security](/docs/security/)), **Tracker** (local files, [GitHub Issues or Linear](/docs/trackers/)), **Workspaces** (a [git worktree per claim](/docs/parallel-work/), and removing finished ones), **[Remote agents](/docs/remote-agents/)** (a token for each agent on another machine, created and revoked here), **Risk policy** ([policy.json](/docs/policy-json/)), **Proof on pull requests** (post each done ticket's [Verified by Teamtrail](/docs/verification/#verified-by-teamtrail) report on its pull request; off by default, on this machine only), **Guides** (every [guide](/docs/guides/) with its status, approving new or changed guides and their checks, **Browse guides** in the catalog, and **Write your own**: your team's guides as Not approved yet or Approved, with a link to share one in the public catalog) and **Labels**. |
| Attention & alerts | **Attention** ([attention.json](/docs/attention-json/), the [review limit](/docs/review-capacity/#the-review-limit) and your [focus hours](/docs/personal-settings/)), **[Slack](/docs/slack/)** and **Trip report** (how long away before Scout briefs you).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| You                | **Hands-off or Hands-on** ([your mode](/docs/hands-off/)), **Appearance** (day, night or match your system), **HITL transcript**, **Agent** and **Browsers & devices** (the browsers [signed in](/docs/sign-in/) to this Lookout, with the short id the terminal announced for a sign-in through the page Teamtrail opened, **Revoke**, **Pair a device** and **Sign out of this browser**).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| All projects       | **Projects**: the repos [All projects](/docs/all-projects/) shows, whether agents add their repo when they connect, and **Share decisions** (offer a project's decisions to your other projects as [suggestions](/docs/decision-memory/#across-projects)).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| About              | **Changelog**: what changed in each release.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## From another device

The Lookout listens on your machine only. Start it with `--host <IP address>` and a phone or laptop on the same network can open it too, at your machine's IP address, such as `http://192.168.1.20:7420`, once you've paired it from **Settings → You → Browsers & devices → Pair a device**. See [Sign in to the Lookout](/docs/sign-in/#a-phone-or-another-computer).

The connection is plain HTTP, so only do this on a network you trust, and never put the Lookout's port behind a proxy or tunnel. For agents on other machines, share [`teamtrail mcp --http`](/docs/remote-agents/) instead.

A paired device can read, answer questions and approve finished work. It never changes what runs on your machine or whom it trusts, and Settings says so: see [Devices on your network](/docs/security/#devices-on-your-network). Paths on your machine show only their last two parts there, and the tracker account isn't shown.

## On a trail's report

The **Report** tab on the Plan page shows one trail's results: lead time, how often you stepped in, rework, reviews and cost per verified ticket. **Export markdown** downloads it.
