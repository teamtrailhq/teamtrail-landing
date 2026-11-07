# Your first trail

Go from an idea to a charted trail, a discovery brief and the first finished ticket.

## 1. Start the Lookout

```bash
cd your-repo
teamtrail
```

## 2. Describe the trail

In Claude Code (Codex: `/prompts:scout new …`):

```text
/scout new "Let field researchers edit notes offline for a week"
```

The agent first checks the work is trail-sized: a bug fix or a single endpoint doesn't need a trail. Then it asks 3–4 framing questions (who it's for, what done looks like, what's out of scope, what's already decided). Answer in the chat or in the Lookout's **Waiting on you** list.

You can also create a trail from the Lookout (**New trail**), then let an agent pick it up with `/scout resume`.

## 3. Review the discovery brief

`start_trail` charts the map and adds a **discovery ticket**. Until you accept the brief, agents can only claim `research`, `junction` and `review` tickets. The agent studies the repo and calls `submit_brief` with:

- what the trail changes, and the product context;
- the existing files and modules involved, with real paths;
- conventions, data model and API impact, risks;
- the assumptions it relies on, and open questions.

Open the brief from the banner on the map, then **Accept** it or **Request changes** with a note. On accept, the brief's assumptions are added to the trail. See [Discovery and knowledge](/docs/discovery-and-knowledge/).

## 4. Let agents work

```text
/scout resume
```

Each agent claims the next ready ticket, agrees on [acceptance criteria](/docs/verification/), asks you only the calls your [risk policy](/docs/policy-json/) says are yours, and closes the ticket with a resolution, a decision record and evidence. Run more agents in parallel; see [Parallel work](/docs/parallel-work/).

## 5. Steer

- **Waiting on you** ranks everything that needs you. See [Waiting on you](/docs/waiting-on-you/).
- `/scout status` and `/scout inbox` do the same from the chat. See [/scout commands](/docs/scout-commands/).
- When the facts change, agents propose a reroute for you to approve. See [Assumptions and reroutes](/docs/adaptive-trails/).

## Skip discovery

For small, well-understood trails, ask the agent to skip it: `start_trail` takes `discovery: false`, and implementation tickets are claimable right away.
