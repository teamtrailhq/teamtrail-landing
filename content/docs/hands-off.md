---
title: Hands-off and Hands-on: what the Lookout shows you · Teamtrail docs
description: Hands-off, everyone's default, shows only what needs you, the trail's progress and what happened since you were away; Hands-on is the full map. The mode never changes what agents may decide or how work is verified.
---

# Hands-off and Hands-on

The Lookout has two modes, chosen per person. **Hands-off**, everyone's default, shows only what needs you, how far the trail is and what happened while you were away: agents keep going, and you step in when a call is yours. **Hands-on** is the full map and every view.

The mode changes what the Lookout shows you. It never changes what agents may decide on their own (the [risk policy](/docs/policy-json/) does that) or how work is verified.

## Switch modes

- **In the header:** **Hands-off · Hands-on**, at the right.
- **In Settings → You → Hands-off or Hands-on** (`?settings=hands`).

The choice is yours alone: it's saved in your own preferences on the Lookout's machine (`attention.json` in your [user config folder](/docs/personal-settings/), as `mode`), never in the repo, so a teammate's Lookout keeps theirs. A device you've paired can switch it too. In [Teamtrail Cloud](/docs/cloud/) it's saved to your account, so every device follows it.

## Hands-off: the home

In place of the map, one column, most important first:

### Needs you

Your [ranked list](/docs/waiting-on-you/) as compact rows, most urgent first, across all your trails. Each row says what it is (Question, Plan, Reroute, Ticket, …), what it asks, the ticket and how long it has waited. The label is red only while something waits.

One row is open at a time: the first, until you open or close another. An open row shows the decision in place, with its choices:

| Row                 | What you can do in place                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| An agent's question | Pick a suggested reply or answer in your own words. **The whole conversation** opens the agent's chat.                                          |
| A ticket            | The ticket's own actions, as in its bubble: **Approve**, **Send to rework**, **Accept the pass…**, **Confirm criteria**, **Unblock** and more.  |
| The plan            | **Approve the plan**: the brief and every ticket's criteria, shown in full and approved in one step. See [Approve the plan](#approve-the-plan). |
| Checks on main      | **Fix main first**, **Drop** or **Start anyway** when main's checks fail.                                                                       |
| A reroute           | **Review** opens the proposal, with its changes drawn on the map.                                                                               |

**Open ticket** opens the full ticket in a drawer over the home. Five rows show (three on a phone); **Show N more** shows the rest. With nothing waiting, Scout says so: _Nothing needs you. Agents keep going; you'll hear only if something does._

### Progress

The trail at a glance: a segment per ticket, coloured as on the trail bar (the ones at work breathe), and the counts in words, such as **4 of 15 done · 2 verified · 1 at work · 3 need you · 6 not started**. **Show the map** draws a short version of the trail under it; the full map is Hands-on's. Under that, one row per agent at work: its ticket, its model and its step.

### Since you were away

What happened on this trail since your last visit (on your first, since the trail was charted):

- **Decisions agents made themselves**, within what the risk policy lets them. **Review** shows why the agent chose this and what else it weighed; **Keep it**, or **Overrule…**: say what it should be instead and why. Your decision replaces the agent's, and both stay on record in the [Logbook](/docs/decision-memory/).
- **Changes to the plan**: tickets ruled out and tickets added.
- **Finished work**: each done ticket, whether it's verified, and its pull request.

### Today

The last line sums up today: **Today: 3 verified, 2 merged.** In [Teamtrail Cloud](/docs/cloud/#auto-merge), with auto-merge on: **4 verified PRs merged automatically today. Unverified work waits for you.**

Hands-off tells you what happened since your last visit on the home itself, so the trip report doesn't open over it: it's still under **Records → Trip report**.

## Approve the plan

When an agent finishes a trail's research, its [discovery brief](/docs/discovery-and-knowledge/) and the tickets it charted with their [acceptance criteria](/docs/verification/#acceptance-criteria) wait for you as one item: **Approve the plan**. Open it and everything it approves is on the page: the brief (what exists, the rules that apply, risks and assumptions), then each ticket with its criteria. Tickets that have no criteria yet are named; their agent writes them before it starts.

**Approve the plan** accepts the brief and confirms every ticket's criteria in one step. Each is bound to exactly what the page showed: if an agent rewrites the brief or a ticket's criteria while you read, the button waits for **Review again**, and Teamtrail checks every part before it approves any of them. Agents start once you approve, and you won't be asked about those criteria again. **Review it first** opens the brief on its own, to accept it the usual way.

Each approval is recorded on your machine, as accepting a brief and confirming criteria always are: see [Approvals and security](/docs/security/).

## Hands-on

Everything else is in Hands-on: the [map](/docs/the-lookout/#the-map) with a bubble beside each ticket, the trail bar, and Plan, Activity and the Logbook. Some things open from Hands-off too (the full ticket, Settings, Records), and a few are Hands-on's only: the map, the trail bar's lists and the dialog that says a trail's research is done.

## On a phone

Hands-off's home is the one view: the header, then Needs you, Progress and Since you were away, with no tab bar. Hands-on is the map with its tab bar, as before.
