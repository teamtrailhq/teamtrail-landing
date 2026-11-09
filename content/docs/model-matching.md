# Model matching

Give each agent the tickets that fit the model it runs on: research on fast models, junctions on the strongest. It's off by default and switched on per trail.

Teamtrail never picks, starts or switches a model. It reads the model an agent already runs on and offers that agent the tickets set for its tier.

## Turn it on

In the Lookout, open **Settings → Model matching** and switch **Match work to models on trail #n** on. The grid below sets the tier for each ticket type on that trail. Changes apply to the next claim; nothing running is interrupted.

The setting lives with the trail. In local files it's in `map.md`:

```md
---
model-matching: on
model-tiers: [research=balanced]
---
```

`model-tiers` holds only the types you changed from the defaults.

## Tiers

Three tiers, weakest first: `fast`, `balanced`, `strongest`.

| Ticket type | Default tier |
| ----------- | ------------ |
| `research`  | `fast`       |
| `task`      | `balanced`   |
| `execute`   | `balanced`   |
| `junction`  | `strongest`  |
| `prototype` | `strongest`  |
| `review`    | `strongest`  |

Next to each type, the grid shows what [Trail stats](/docs/trail-stats/) measured for it (tickets done, median time, rework). It's there to inform your choice; nothing changes a tier on its own.

## How an agent's model is found

The MCP server reads the model of the agent's latest call from its own local log: the Claude Code session transcript or the Codex session log (see [Connect your agent](/docs/connect-your-agent/)). Otherwise it uses the model in the session's reported usage.

The model id is matched to a tier: first your project's `models.json`, then a built-in table of model families. For example, `*claude-haiku-*` and `*-mini` are `fast`, `*claude-sonnet-*` and `gpt-4*` are `balanced`, `*claude-opus-*`, `gpt-5*` and `o3` are `strongest`. An agent that reports no model, or a model neither table knows, counts as `balanced`, so it never blocks work.

### models.json

Add new or custom models in `.teamtrail/models.json`. It's optional and committed.

```json
{
  "v": 1,
  "models": {
    "my-finetune-v2": "strongest",
    "local-llama-*": "fast"
  }
}
```

| Key      |                                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `v`      | `1`.                                                                                                                                     |
| `models` | Model id or glob to `fast`, `balanced` or `strongest`. `*` matches any run of characters; case doesn't matter. Exact ids win over globs. |

Unknown keys and unknown tiers are errors. While the file has errors, only the built-in table counts; **Settings → Model matching** lists them.

## What agents get

With matching on, `claim_ticket` and `next_ticket` without a ticket offer the best ready ticket at the agent's tier, then lower tiers, nearest first. A strong agent is never idle while work waits, and a weaker one never gets a ticket set above its tier on its own.

| Field      | When                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `tier`     | On claim and next results while matching is on: `{ session, ticket, model? }`.                                           |
| `tierNote` | The agent claimed a ticket by key that's set for a stronger tier than it runs. It tells you it took the ticket anyway.   |
| `reason`   | `next_ticket` found nothing at or below the agent's tier: which tickets wait for a stronger model, and the agent's tier. |

`status` and `resume_trail` include `modelMatching`: on or off, the tier per ticket type, and the session's tier with the reason.

An agent can always claim any ticket by key.

## Waiting for a stronger model

When a ready ticket is set for a stronger tier than any connected agent runs, it waits. It shows on the map as needing that tier, and as a `model` item in [Waiting on you](/docs/waiting-on-you/): connect an agent on a stronger model, or have one claim the ticket by key. Nothing waits while matching is off or no agent is connected.

The Lookout also shows each session's tier next to its name in **Current trail step**, and **Settings → Model matching** lists the agents connected now with their tiers.
