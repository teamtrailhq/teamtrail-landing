# The Lookout

The web app `teamtrail` serves on your machine, where you steer your trails. It opens on the repo you started it in, and can supervise your other repos too ([All projects](/docs/all-projects/)). This is what's in it and where to find it.

## The zones

| Zone               | What it's for                                                                                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Communication      | **Waiting on you**, the [ranked list](/docs/waiting-on-you/) of what needs you, and the conversation with the agent asking. Up next shows the tickets ready to pick up.                                    |
| Trail map          | Every ticket as a sign on the trail, with what blocks what, its guide, and whether it waits for a stronger model. **Fit** shows the whole map, and the **Summary** tab at the bottom slides up the counts. |
| Trail step         | The selected ticket: type, who has it, what blocks it, its [guide](/docs/guides/) (pick one under **Guide**) and checklist answers, its criteria and the knowledge its agent gets.                         |
| Current trail step | What each agent is doing right now, step by step. With [model matching](/docs/model-matching/) on, each session shows its model's tier.                                                                    |
| Activity log       | Everything that happened, newest first.                                                                                                                                                                    |
| Trail plan         | The plan's tabs: Not yet specified, Assumptions, Decisions, Out of scope, Notes and Report.                                                                                                                |

## The header

| Control        | What it does                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo name      | With more than one project, switch projects or open **All projects**. A badge counts what interrupts in your other projects.                            |
| Trail title    | Switch trails, or start a new one.                                                                                                                      |
| Focus          | Hold back interruptions. See [Personal settings](/docs/personal-settings/).                                                                             |
| Plan + execute | The trail's mode: plan only, or plan and build.                                                                                                         |
| Records        | The views below.                                                                                                                                        |
| Sun or moon    | Switch between the day and night themes.                                                                                                                |
| Settings       | The tracker, Slack, verification, model matching, risk policy, attention, workspaces, projects, guides, the trail's team, appearance and the changelog. |

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

| Section                | What it's for                                                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trail #n               | The trail's mode: plan only, or plan and build.                                                                                                           |
| Tracker, Slack         | Local files, [GitHub Issues or Linear](/docs/trackers/); [Slack](/docs/slack/).                                                                           |
| Verification           | The trail's [verification level](/docs/verification/) and the checks in `verification.json`.                                                              |
| Model matching         | Turn [model matching](/docs/model-matching/) on for the trail and set the tier per ticket type, with what Trail stats measured.                           |
| Risk policy, Attention | [policy.json](/docs/policy-json/), [attention.json](/docs/attention-json/) and your [focus hours](/docs/personal-settings/).                              |
| Workspaces             | A [git worktree per claim](/docs/parallel-work/), and removing finished ones.                                                                             |
| Projects               | The repos [All projects](/docs/all-projects/) shows, and whether agents add their repo when they connect.                                                 |
| Guides                 | Every [guide](/docs/guides/) with its status: approve new or changed guides and the checks they propose, remove one, or **Browse guides** in the catalog. |
| Team of #n             | The guides the trail's tickets use. With Reviewer on the team, review tickets get the reviewer guide.                                                     |
| Appearance             | Day, night or match your system.                                                                                                                          |

## On a trail's report

The **Report** tab in Trail plan shows one trail's results: lead time, how often you stepped in, rework, reviews and cost per verified ticket. **Export markdown** downloads it.
