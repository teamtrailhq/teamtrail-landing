# policy.json

What agents may decide on their own and what always comes to you, committed in `.teamtrail/policy.json`.

Without the file, the defaults below apply. Edit it in **Settings → Risk policy** or by hand.

## Levels

| Level    | The agent                                                                     |
| -------- | ----------------------------------------------------------------------------- |
| `low`    | Decides.                                                                      |
| `medium` | Decides, follows your conventions and records the decision for you to review. |
| `high`   | Must ask you with `ask_human`. Recording the decision itself is rejected.     |

Agents pass a `category` (and the `paths` they change) to `ask_human`, `record_decision`, `close_ticket` and `report_completion`. The highest level that applies wins: the category's level, or any path rule that matches. Decisions keep their level and the reason, and the briefing groups agent decisions by level. Calls without a category or paths behave as before.

## Example

```json
{
  "v": 1,
  "categories": {
    "product-behaviour": "high",
    "dependencies": "low"
  },
  "paths": [
    { "glob": "**/migrations/**", "level": "high", "category": "schema" },
    { "glob": "api/openapi.yaml", "level": "high", "category": "breaking-api" },
    { "glob": "src/payments/**", "level": "high", "category": "billing" }
  ]
}
```

## Keys

| Key          | Type                       | Default   |                                                    |
| ------------ | -------------------------- | --------- | -------------------------------------------------- |
| `v`          | `1`                        | required  | File format version.                               |
| `categories` | object of category → level | see below | Categories you leave out keep their default level. |
| `paths`      | list of rules              | see below | When present, **replaces** the default rules.      |

### Categories and defaults

| Category            | Default  |
| ------------------- | -------- |
| `schema`            | `high`   |
| `breaking-api`      | `high`   |
| `auth-permissions`  | `high`   |
| `billing`           | `high`   |
| `data-deletion`     | `high`   |
| `product-behaviour` | `medium` |
| `dependencies`      | `medium` |

### Path rules

| Key        | Type               |                                                                                      |
| ---------- | ------------------ | ------------------------------------------------------------------------------------ |
| `glob`     | string             | Path glob: `**/` matches any number of folders (or none), `*` stays within a folder. |
| `level`    | level              | The level for matching files.                                                        |
| `category` | category, optional | The category to report.                                                              |

Default rules:

```json
[
  { "glob": "**/migrations/**", "level": "high", "category": "schema" },
  { "glob": "**/*.sql", "level": "high", "category": "schema" },
  { "glob": "**/auth/**", "level": "high", "category": "auth-permissions" },
  { "glob": "**/billing/**", "level": "high", "category": "billing" },
  { "glob": "package.json", "level": "medium", "category": "dependencies" },
  { "glob": "**/package.json", "level": "medium", "category": "dependencies" }
]
```

## Risky changes made without asking

When an agent's finished work changed files matching a `high` rule and you didn't decide on that ticket, a `policy` item appears in [Waiting on you](/docs/waiting-on-you/) for you to check.

## Errors

Every problem is listed in Settings, and the defaults apply until the file is valid:

```text
unknown category "security" (schema, breaking-api, auth-permissions, billing, data-deletion, product-behaviour, dependencies)
paths[2].level must be one of low, medium, high
```
