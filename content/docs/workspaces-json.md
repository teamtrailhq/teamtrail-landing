# workspaces.json

Whether each claimed ticket gets its own git worktree, committed in `.teamtrail/workspaces.json`.

Without the file, workspaces are off. Toggle them in **Settings → Workspaces**; `dir` can only be set in the file.

## Example

```json
{
  "v": 1,
  "worktrees": true,
  "dir": "../worktrees"
}
```

## Keys

| Key         | Type        | Default               |                                                                                                                                                             |
| ----------- | ----------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v`         | `1`         | required              | File format version.                                                                                                                                        |
| `worktrees` | boolean     | `false`               | `true` gives every claimed ticket a worktree on branch `teamtrail/<trail>/<n>`. With `false`, an agent can still ask for one per claim (`workspace: true`). |
| `dir`       | folder path | `../<repo>.teamtrail` | Where worktrees go. A relative path starts from the repo root. Each worktree is `<dir>/<trail>-<n>`.                                                        |

## Errors

Any other key or a wrong type is an error, shown in Settings:

```text
unknown key "branchPrefix"
"worktrees" must be true or false
"dir" must be a folder path
```

A new worktree gets the [setup steps](/docs/verification-json/#setup) you approved run in it, so its checks find their dependencies. See [Parallel work](/docs/parallel-work/) for what happens on claim and completion.
