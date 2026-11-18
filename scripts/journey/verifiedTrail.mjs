// The journey's verification beats, set up exactly: a small trail of two tasks, worked by a scripted MCP agent of the
// built CLI on its own worktrees. One adds the CI workflow and is done; the other changes package.json's `test`
// script, so its pass means nothing and the check guard holds it for the trail lead. After the trail lead accepts it,
// `merge()` merges both branches into main for real, and Teamtrail runs the checks on main by itself: the trail is
// verified together.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ID = ['-c', 'user.name=Fieldnote', '-c', 'user.email=dev@fieldnote.app'];
const git = (cwd, ...args) => execFileSync('git', [...ID, ...args], { cwd, encoding: 'utf8' }).trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const TRAIL = 'Tests on every platform';
export const GUARDED = 'Run the tests on Windows';

/** Claims `key` once the checks on main have run for the new trail (implementation waits for them). */
async function claim(call, key, mapId) {
  for (let i = 0; ; i++) {
    try {
      return await call('claim_ticket', { ticket: key, trail: mapId, touches: ['package.json', '.github/**'] });
    } catch (e) {
      if (i > 240 || !/on main/.test(e.message)) throw e;
      await sleep(500);
    }
  }
}

/** Claims, writes `files` in the ticket's worktree, commits them and completes the ticket. */
async function work(call, { key, mapId, files, resolution }) {
  const { workspace } = await claim(call, key, mapId);
  if (!workspace?.path) throw new Error(`no worktree for ${key}`);
  for (const [file, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(workspace.path, file)), { recursive: true });
    fs.writeFileSync(path.join(workspace.path, file), text);
    git(workspace.path, 'add', file);
  }
  git(workspace.path, 'commit', '-qm', resolution);
  const closed = await call('close_ticket', { ticket: key, trail: mapId, resolution });
  return { status: closed.status, branch: workspace.branch, closed };
}

/**
 * Starts the trail (skipping discovery, which the trail lead approves here with the Lookout's own calls from `page`'s
 * session) and works both tickets. Returns `merge()`, for after the held pass is accepted.
 */
export async function setUpVerifiedTrail({ project, page }) {
  const agent = await project.mcpAgent('claude-code');
  const started = await agent.call('start_trail', {
    discovery: false,
    title: TRAIL,
    destination: 'The test suite runs on Windows and in CI, on every pull request.',
    tickets: [
      { ref: 'ci', title: 'Run the tests in CI', type: 'task' },
      { ref: 'win', title: GUARDED, type: 'task' },
    ],
  });
  const mapId = started.trail.id;
  const api = new URL('__teamtrail/', project.url).href;
  await page.evaluate(
    async ({ api, mapId, id }) => {
      const { secret } = JSON.parse(localStorage.getItem('teamtrail.session') || '{}');
      const headers = { 'X-Teamtrail-Session': secret, 'Content-Type': 'application/json' };
      const shown = await (await fetch(`${api}reroutes/${id}?map=${mapId}`, { headers })).json();
      const r = await fetch(`${api}reroutes/approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mapId, id, hash: shown.reroute.hash }),
      });
      if (!r.ok) throw new Error(`skipping discovery refused: ${r.status} ${await r.text()}`);
    },
    { api, mapId, id: started.skipDiscovery.request },
  );
  const [ci, win] = started.tickets.map((t) => t.key);
  const done = await work(agent.call, {
    key: ci,
    mapId,
    resolution: 'CI runs npm test on every pull request',
    files: {
      '.github/workflows/test.yml':
        'name: test\non: [pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm test\n',
    },
  });
  const pkg = JSON.parse(fs.readFileSync(path.join(project.dir, 'package.json'), 'utf8'));
  pkg.scripts.test = `${pkg.scripts.test} && echo windows`;
  const held = await work(agent.call, {
    key: win,
    mapId,
    resolution: 'npm test runs on Windows',
    files: { 'package.json': `${JSON.stringify(pkg, null, 2)}\n` },
  });
  if (done.status !== 'done') throw new Error(`${ci} ended ${done.status}: ${JSON.stringify(done.closed)}`);
  if (held.status !== 'blocked' || !held.closed.checkGuard)
    throw new Error(`${win} wasn't held by the check guard: ${JSON.stringify(held.closed)}`);
  await agent.close();
  return {
    mapId,
    /** Merges both branches into main, as the trail lead does once they've reviewed them; returns main's short sha. */
    merge() {
      for (const branch of [done.branch, held.branch])
        git(project.dir, 'merge', '-q', '--no-ff', '-m', `Merge ${branch}`, branch);
      return git(project.dir, 'rev-parse', '--short=7', 'HEAD');
    },
  };
}
