# Your first trail

Go from an idea to a charted trail, an approved plan and the first verified ticket.

## 1. Start the Lookout

```bash
cd your-repo
teamtrail
```

Your browser opens on the Lookout's sign-in page: click **Sign in this browser**. If it opens signed out instead, use the one-time **Sign in** link printed in the terminal. See [Sign in to the Lookout](/docs/sign-in/).

If the repo already has trails or checks committed, **Settings → Project → Approvals** asks you to adopt them on this machine first: see [Approvals and security](/docs/security/#the-first-run).

## 2. Describe the trail

In Claude Code (Codex: `/prompts:scout new …`):

```text
/scout new "Let field researchers edit notes offline for a week"
```

The agent first checks the work is trail-sized: a bug fix or a single endpoint doesn't need a trail. Then it asks 3–4 framing questions (who it's for, what done looks like, what's out of scope, what's already decided). Answer in the chat or in the Lookout's **Waiting on you** list. Chat answers guide the agent; calls that are yours to make need your answer in the Lookout or Slack, and high-risk ones in the Lookout.

### Or write it in the Lookout

**New trail**, in the trail menu under the title, is an editor sized for documents (full screen on a phone):

| Field       | What goes in it                                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title       | The trail's name.                                                                                                                                                       |
| Destination | What is true when the trail is done, in markdown. Its first sentence is the one-line summary in the header; Plan → Destination shows it whole. Up to 10,000 characters. |
| Assumptions | One per line, each a sentence the plan relies on; the dialog says how many it will create. Up to 100, of up to 500 characters each.                                     |
| Notes       | Optional: a spec, a design doc, links, in markdown. Up to 50,000 characters.                                                                                            |

**Write** and **Preview** switch each field between the text and how it renders. **Load from file** (or drop a file on the field) puts a `.md`, `.markdown` or `.txt` file in the destination or the notes, to edit before you create; when the field already has text, choose **Replace** or **Append**. The file is read in your browser and goes nowhere until you create the trail. A file or an append that would pass the field's limit is refused, with the reason. On GitHub Issues, a trail whose issue body would pass GitHub's 65,536 characters is refused before anything is sent.

Text you've typed is never lost to a stray click or **Esc**: only **Close** leaves a dialog with something in it. **Create trail** puts the trail on the map; an agent picks it up with `/scout resume`. Or copy the `/scout new "…"` command at the bottom into Claude Code or Codex, and Scout frames the trail with you there.

## 3. Review the discovery brief

`start_trail` charts the map and adds a **discovery ticket**. Until you accept the brief, agents can only claim `research`, `junction` and `review` tickets. The agent studies the repo and calls `submit_brief` with:

- what the trail changes, and the product context;
- the existing files and modules involved, with real paths;
- conventions, data model and API impact, risks;
- the assumptions it relies on, and open questions.

When the brief is in, **Needs you** on the [Hands-off](/docs/hands-off/) home shows **Approve the plan**: open it to read the brief and every charted ticket's acceptance criteria on one page, then approve them all in one step. Agents start once you do. To look at the brief on its own, **Review it first** (or, in Hands-on, the banner on the map) opens it, to **Accept** it or **Request changes** with a note. On accept, the brief's assumptions are added to the trail. See [Discovery and knowledge](/docs/discovery-and-knowledge/).

Criteria an agent charted with a ticket are yours to confirm before any agent starts that ticket: Approve the plan does that for the whole trail. See [Done means verified](/docs/verification/#done-means-verified).

## 4. Let agents work

```text
/scout resume
```

Each agent claims the next ready ticket, agrees on [acceptance criteria](/docs/verification/), asks you only the calls your [risk policy](/docs/policy-json/) says are yours, and closes the ticket with a resolution, a decision record and evidence. Run more agents in parallel; see [Parallel work](/docs/parallel-work/).

## 5. Steer

- **Hands-off** (the default) opens on what needs you, most urgent first: answer or approve it right in the list. **Since you were away** tells you what agents decided and finished meanwhile. See [Hands-off and Hands-on](/docs/hands-off/).
- **Hands-on** is the map: **N need you** in the header opens the most urgent thing in a bubble beside its ticket, and **More** in the trail bar lists everything that needs you, ranked. See [The Lookout](/docs/the-lookout/) and [Waiting on you](/docs/waiting-on-you/).
- `/scout status` and `/scout inbox` do the same from the chat. See [/scout commands](/docs/scout-commands/).
- When the facts change, agents propose a reroute for you to approve. See [Assumptions and reroutes](/docs/adaptive-trails/).

## Skip discovery

For small, well-understood trails, ask the agent to skip it. The agent passes `discovery: false` to `start_trail`, and you get a request to **Approve** or **Decline**. Approve it in the Lookout (in Slack you can only decline it). Saying yes in the chat doesn't approve it. Once you approve, implementation tickets are claimable right away.
