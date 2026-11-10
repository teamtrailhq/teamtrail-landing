# The Lookout

The web app `teamtrail` serves on your machine, where you steer your trails. It opens on the repo you started it in, and can supervise your other repos too ([All projects](/docs/all-projects/)). This is what's in it and where to find it.

## The zones

| Zone               | What it's for                                                                                                                                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Communication      | **Waiting on you**, the [ranked list](/docs/waiting-on-you/) of what needs you, and the conversation with the agent asking. Up next shows the tickets ready to pick up.                                                                            |
| Trail map          | Every ticket as a card on the trail (its status, title, type, guide and who has it), joined to what it blocks, and whether it waits for a stronger model. **Fit** shows the whole map, and the **Summary** tab at the bottom slides up the counts. |
| Trail step         | The selected ticket: type, who has it, what blocks it, its [guide](/docs/guides/) (pick one under **Guide**) and checklist answers, its criteria and the knowledge its agent gets.                                                                 |
| Current trail step | What each agent is doing right now, step by step. With [model matching](/docs/model-matching/) on, each session shows its model's tier.                                                                                                            |
| Activity log       | Everything that happened, newest first.                                                                                                                                                                                                            |
| Trail plan         | The plan's tabs: Not yet specified, Assumptions, Decisions, Out of scope, Notes and Report.                                                                                                                                                        |

## The header

| Control        | What it does                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Repo name      | With more than one project, switch projects or open **All projects**. A badge counts what interrupts in your other projects.                                                                           |
| Trail title    | Switch trails, or start a new one.                                                                                                                                                                     |
| Focus          | Whether focus is on (**Focus on · until 12:00**, **Focus paused** or **Focus off**). Click it to focus for a while or end it. See [Focus in the header](/docs/personal-settings/#focus-in-the-header). |
| Plan + execute | The trail's mode: plan only, or plan and build.                                                                                                                                                        |
| Records        | The views below.                                                                                                                                                                                       |
| Settings       | Opens the Settings page. See [Settings](#settings) below.                                                                                                                                              |
| Sun or moon    | Switch between the day and night themes.                                                                                                                                                               |

## Records

| View                              | What it's for                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Trip report                       | Scout's summary of what happened while you were away.                                                        |
| Field guide                       | What agents know about your code and product. See [Discovery and knowledge](/docs/discovery-and-knowledge/). |
| Logbook                           | Every decision across your trails, with its reasoning.                                                       |
| [Trail stats](/docs/trail-stats/) | How your agents deliver across trails.                                                                       |

## All projects

Open it from the repo name in the header. One **Needs you** list across your repos, where you can answer an agent's question in any of them, one row per project, and **While you were away** across projects. See [All projects](/docs/all-projects/).

## Settings

**Settings** in the header opens a full page, with the groups in a side nav and one group at a time on the right. **Esc** or **Back to the Lookout** returns to the map. Each section can be linked to directly: `?settings=<section>`, for example `?settings=tracker`, `?settings=models` or `?settings=guides`. Each section says where it's saved: committed to the repo, only on this machine, or only in this browser.

| Group              | Sections                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| This trail         | **Trail mode** (plan only, or plan and build), **Verification** (the [level](/docs/verification/) and the checks in `verification.json`), **[Model matching](/docs/model-matching/)** and **Team** (the guides the trail's tickets use; with Reviewer on the team, review tickets get the reviewer guide).                                                                                                                                                                                                           |
| Project            | **Tracker** (local files, [GitHub Issues or Linear](/docs/trackers/)), **Workspaces** (a [git worktree per claim](/docs/parallel-work/), and removing finished ones), **Risk policy** ([policy.json](/docs/policy-json/)), **Guides** (every [guide](/docs/guides/) with its status, approving new or changed guides and their checks, **Browse guides** in the catalog, and **Write your own**: your team's guides as Not approved yet or Approved, with a link to share one in the public catalog) and **Labels**. |
| Attention & alerts | **Attention** ([attention.json](/docs/attention-json/) and your [focus hours](/docs/personal-settings/)), **[Slack](/docs/slack/)** and **Trip report** (how long away before Scout briefs you).                                                                                                                                                                                                                                                                                                                     |
| You                | **Appearance** (day, night or match your system), **HITL transcript** and **Agent**.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| All projects       | **Projects**: the repos [All projects](/docs/all-projects/) shows, and whether agents add their repo when they connect.                                                                                                                                                                                                                                                                                                                                                                                              |
| About              | **Changelog**: what changed in each release.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## On a trail's report

The **Report** tab in Trail plan shows one trail's results: lead time, how often you stepped in, rework, reviews and cost per verified ticket. **Export markdown** downloads it.
