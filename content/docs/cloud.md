---
title: Teamtrail Cloud: hosted Lookout, agents in sandboxes, auto-merge · Teamtrail docs
description: Teamtrail Cloud, in early access, hosts your Lookout, runs your agents in sandboxes, checks their work on the commit they pushed and merges verified pull requests by itself. What it needs from GitHub and the rules auto-merge follows.
---

# Teamtrail Cloud

[Teamtrail Cloud](/cloud/), in early access, is the hosted version: your Lookout at its own address, your team signed in with GitHub, and your agents running in sandboxes while your laptop is closed. It runs the same engine as Teamtrail on your machine, and keeps trails in the same plain-file format. This page covers what's different.

## A workspace

Each workspace has its own engine, address and storage, backed up daily; nothing is shared between workspaces. People sign in with GitHub and have a role:

| Role   | Can                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Owner  | Everything: settings, repositories, people, API keys, and high-risk calls. Owners can name others who may make high-risk calls. |
| Member | Answer agents, approve and send back work, switch agents on.                                                                    |
| Viewer | Read.                                                                                                                           |

Hands-off or Hands-on is saved to each person's account, so every device follows it: see [Hands-off and Hands-on](/docs/hands-off/). You can export everything at any time and run it locally.

## Your repositories, through the GitHub App

An owner connects repositories through Teamtrail Cloud's GitHub App and picks which ones agents may work in. Each agent run gets a short-lived token for one repository. The app asks for:

| Permission             | Access         | Why                                                                                                              |
| ---------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Contents               | Read and write | Agents push their branch; checks read the code.                                                                  |
| Pull requests          | Read and write | A pull request per ticket, its proof as a comment, and merging verified work.                                    |
| Commit statuses        | Read and write | The `Teamtrail proof` status on each pull request.                                                               |
| Checks                 | Read-only      | Auto-merge names the checks that failed or are still running. Without it, it still waits, with a plainer reason. |
| Metadata               | Read           | Required by GitHub.                                                                                              |
| Members (organization) | Read-only      | To check the person connecting an organization is its owner.                                                     |

## Agents in sandboxes

Turn on **Run my agents** and Cloud runs Claude Code or Codex on the ready work, each agent in its own sandbox, on your own Anthropic or OpenAI key. Each ticket gets a branch and a pull request. The **Agents** page shows each run, its logs, its model and its hours. While the [review limit](/docs/review-capacity/#teamtrail-cloud) holds a trail back, no agent starts on it.

What you see keeps up with the runs:

- **Work starts within seconds.** When work becomes ready (you approve a plan, confirm criteria, free the review limit), an agent starts on it within seconds. **Pause** then **Start** starts again at once, and a trail that waits says why.
- **Tickets go back at once.** A run that ends, fails or is lost returns the tickets its agent held to the queue straight away, and a sandbox that dies ends its run at once, so nothing sits claimed by an agent that's gone.
- **Pull requests while a run goes.** Each run's pull requests and their proofs show every 2 minutes while it works, not only when it ends, however many pull requests the repository has open.
- **Disconnecting a repository** stops its runs.

## Verified on the commit they pushed

Cloud agents are [remote agents](/docs/remote-agents/): nothing runs on your machine. When one finishes, Cloud runs your approved checks in a fresh sandbox on the exact commit it pushed, and the proof names that commit and the runner. The checks on main and the trail's [combined run](/docs/verification/#trail-verified-together) run there too, on exactly the commit Teamtrail names on the default branch. Each done ticket's signed [proof](/docs/verification/#verified-by-teamtrail) is posted on its pull request, with the `Teamtrail proof` status, and Cloud opens one pull request per repository proposing the workspace's proof key.

## Auto-merge

Verified pull requests merge by themselves. Auto-merge is on by default for every workspace. Every couple of minutes Cloud looks at the agents' open pull requests and merges one only when all of these hold:

- its ticket is done and its Teamtrail proof is **verified**;
- the proof covers exactly the pull request's **head commit**: a push after verification makes it wait;
- the ticket isn't **high risk**;
- the pull request isn't a draft and has no conflicts with its base branch;
- GitHub says it can merge with **every check passed**, required or not. Auto-merge never merges past a failing check.

It squash-merges at that head commit, as **Approve and merge** in the Lookout does, and leaves a comment on the pull request and on the ticket. A merge, or why one waits, is passed to your Lookout again on every round until it confirms, so the ticket always shows it; once merged, it shows as **Merged** and nothing offers to merge it again.

Anything else waits for a person, and says why, on the ticket and on the **Repositories** page:

| Waits because                                                   | What closes it                                                                                                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The proof isn't verified                                        | The ticket's gaps close (see [Done means verified](/docs/verification/#done-means-verified)), or a person merges it with **Merge anyway**. Never automatic. |
| A high-risk ticket                                              | Someone allowed to make high-risk calls approves and merges it from the Lookout.                                                                            |
| The head moved after it was verified                            | A new completion verifies the new commit.                                                                                                                   |
| A draft, or conflicts with the base branch                      | The agent or a person fixes the pull request.                                                                                                               |
| Checks failed on GitHub (named)                                 | The checks pass.                                                                                                                                            |
| Behind its base branch, when the repository requires up to date | Update the branch.                                                                                                                                          |
| GitHub requires something else (a required review)              | Whatever the repository's rules ask for.                                                                                                                    |

Checks still running aren't reported as a wait: the pull request merges once they pass.

Hands-off's home says how many verified pull requests merged automatically today: **4 verified PRs merged automatically today. Unverified work waits for you.**

### Turn it off

An owner turns auto-merge off, or on again, on the workspace's **Repositories** page, in the **Auto-merge** panel. The panel shows who changed it last, the latest automatic merges and what waits for a person and why. With it off, every pull request waits for a person: **Approve and merge** in the Lookout, or GitHub.

### Limits

At most 20 automatic merges per workspace an hour. A merge GitHub refuses three times at the same head commit is left to a person. Each merge happens once, at the given head, even if Cloud restarts mid-way.
