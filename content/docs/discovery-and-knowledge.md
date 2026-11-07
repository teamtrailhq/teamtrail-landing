# Discovery and knowledge

Agents learn your project before they build: a discovery brief you approve, and project knowledge that every later agent receives.

## The discovery brief

New trails start with a **discovery ticket** (`research`, "Discovery brief: map the existing system"). Until you accept the brief, agents can only claim `research`, `junction` and `review` tickets; claiming anything else returns the reason, for example that the brief is still waiting for your review.

The agent investigates and calls `submit_brief` with:

| Section            | Required |                                                           |
| ------------------ | -------- | --------------------------------------------------------- |
| `summary`          | Yes      | What the trail changes.                                   |
| `productContext`   |          | Who it's for and the product rules that apply.            |
| `existing`         | Yes      | Files, services and modules involved, each with its path. |
| `conventions`      |          | Conventions and abstractions to follow.                   |
| `dataModel`, `api` |          | Data model and API impact.                                |
| `risks`            |          | Risks and possible regressions.                           |
| `assumptions`      |          | What the plan relies on (numbered `A-1`, `A-2`, …).       |
| `openQuestions`    |          | What the agent couldn't find out.                         |

The brief's status moves `draft` → `submitted` → `accepted`, or `changes-requested` with your note, which the agent reads with `get_brief`. On accept, the brief's assumptions become the trail's [assumptions](/docs/adaptive-trails/). Trails started with `discovery: false` have no brief and no gate.

In the Lookout: the banner on the map, then **Accept** or **Request changes**. Sections can be saved as knowledge with one click.

## Project knowledge

Knowledge entries are short, reviewed facts about the codebase and product, stored in `knowledge/K-<n>.md` and committed so teammates share them.

| Status       | Meaning                             | Reaches agents?              |
| ------------ | ----------------------------------- | ---------------------------- |
| `suggested`  | Proposed by an agent, not reviewed. | No                           |
| `confirmed`  | You confirmed it. Binding.          | Yes                          |
| `assumption` | Accepted, but unverified.           | Yes, marked as an assumption |
| `outdated`   | Retired.                            | No                           |

Kinds: `architecture`, `convention`, `gotcha`, `dead-end`, `glossary`, `fact` (engineering) and `business-rule`, `product-decision`, `persona`, `ux-principle`, `pricing` (product).

### How agents get it

When an agent claims a ticket, Teamtrail picks the relevant live entries (by path globs in `scope`, by words in the ticket, by trail), each with the reason it was picked, within a fixed size budget. Discovery tickets get product knowledge first. Business rules are also suggested as [acceptance criteria](/docs/verification/).

Agents can `search_knowledge`, `propose_knowledge` (always lands as `suggested`) and `flag_knowledge` when an entry looks outdated. Only you confirm, edit or retire entries, in the **Knowledge** view.

### Staleness

An entry can name the files it's about (`anchors`). When you confirm it, Teamtrail keeps each file's git blob hash; if a file changes later, the entry reaches agents marked `mayBeOutdated` with the changed paths.

### Import an existing spec

```bash
teamtrail knowledge import docs/product-spec.md
```

Each `##` section becomes a `suggested` entry for you to review. See [CLI commands](/docs/cli/).
