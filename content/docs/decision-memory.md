# Decision memory

You don't get asked the same thing twice. Before an agent asks you a question, Teamtrail looks through the decisions already made on the project. When one already answers it, the agent gets that decision back instead of a question.

## Before an agent asks

When an agent calls [`ask_human`](/docs/mcp-tools/#the-human), Teamtrail first matches the question against your decisions. Superseded decisions never count. Each match comes with the reasons it matched, and is one of two strengths:

| Strength    | When                                                                                                                                                                                    | What happens                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `strong`    | The agent named the decision; or it was made on the same ticket, in the same risk category or in similar words; or it covers the same files or folder and is in the same risk category. | Nothing is asked. The agent gets the decision back and goes on from it.                |
| `suggested` | Only similar wording, a shared assumption, the same ticket or the same files alone, or a decision from another project.                                                                 | The question is asked as usual. The suggestion helps the agent, never answers for you. |

A decision covers the files its ticket's latest passing attempt changed.

## Asking anyway

An agent that thinks a strong precedent doesn't fit its question passes `askAnyway`. The question then comes to you as usual, with the earlier decision next to it, in the Lookout and in Slack. Your answer is a new decision; supersede the old one if it no longer holds.

## Looking it up

[`find_precedent`](/docs/mcp-tools/#decision-memory) is the read-only lookup: the decisions that may answer a question, strongest first, each with why it matches. An agent passes the question's text and, where it knows them, the ticket, risk categories, files, assumptions and decisions it relates to. `allProjects` adds the decisions your other projects share.

## When later work touches a decision

When verified work changes files one of your earlier decisions covers, a `precedent` item appears in [Waiting on you](/docs/waiting-on-you/): the ticket, the files and the decision, so you can check it still holds before the change ships. Only decisions a person made count here, not an agent's own.

## By area

The **Logbook** (Records → Logbook) has a **By area** view. It groups decisions by the folder they're about, or by risk category when they cover no files, with the most cited first: the decisions later ones lean on most. Each decision shows who made the call, by name.

## Across projects

In **Settings → Projects**, **Share decisions** offers a project's decisions to your other [projects](/docs/all-projects/#sharing-decisions). They come back only as `suggested`, through `find_precedent` with `allProjects`: another repo's call never answers a question here. It's off by default, and the setting lives in your config folder, never in a repo.
