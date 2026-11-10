// A real Teamtrail project for the capture scripts, set up the way a user has one: the dev seed written into a
// git repo, the built `teamtrail` server serving it, and real MCP agents (scripts/dev-agent.mjs) working it.
// Needs the product repo next to this one (../teamtrail, or TEAMTRAIL_REPO) with the CLI built: npm run build -w teamtrail.
// The project registry (All projects) lives in a temp config dir (TEAMTRAIL_CONFIG_DIR), never in yours: this project
// plus the seed's second repo, billing-service, so the Lookout shows two projects.
// The repos sit in /Users/Shared/code (CAPTURE_CODE_DIR overrides it) rather than in a temp folder, because their
// paths show in the shots (each claim's worktree, in Settings → Workspaces) and should read like a dev folder, with
// no temp folder or user name in them. Each run empties and then deletes them. One capture runs at a time.
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo =
  process.env.TEAMTRAIL_REPO ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../teamtrail');
const cli = path.join(repo, 'packages/cli/dist/cli.js');
const MARKER = '.teamtrail-capture';

/** The app's own files, so the repo looks like Fieldnote and each claim gets a worktree to work in. */
const SOURCES = {
  'package.json': '{\n  "name": "fieldnote-app",\n  "private": true\n}\n',
  'README.md': '# Fieldnote\n\nNotes for field researchers, online or off.\n',
  'src/sync/client.ts': 'export async function pushEdits() {}\n',
  'src/storage/notes.ts': 'export function saveNote() {}\n',
  'src/api/notes.ts': 'export async function putNote() {}\n',
  'src/notes/NoteList.tsx': 'export function NoteList() {\n  return null;\n}\n',
};

/** Where the capture repos go. */
const CODE = process.env.CAPTURE_CODE_DIR ?? '/Users/Shared/code';

/** A folder of ours in CODE, emptied first; refuses one it didn't make. */
function fresh(dir) {
  if (fs.existsSync(dir)) {
    if (!fs.existsSync(path.join(dir, MARKER))) throw new Error(`${dir} exists and isn't a capture project`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, MARKER), 'Made by the landing capture scripts; deleted after each run.\n');
}

/** A git repo with one commit, so claims get their own worktree (`<repo>.teamtrail/<trail>-<n>`). */
function gitRepo(dir) {
  for (const [file, text] of Object.entries(SOURCES)) {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), text);
  }
  fs.writeFileSync(path.join(dir, '.gitignore'), `${MARKER}\n`);
  const git = (...args) =>
    execFileSync('git', ['-c', 'user.name=Fieldnote', '-c', 'user.email=dev@fieldnote.app', ...args], {
      cwd: dir,
      stdio: 'ignore',
    });
  git('init', '-q', '-b', 'main');
  git('add', '-A');
  git('commit', '-q', '-m', 'Fieldnote');
}

/** Seeds the project, starts the server and `agents` MCP agents; `stop()` ends them and deletes the folders. */
export async function realProject({ agents = 2 } = {}) {
  if (!fs.existsSync(cli)) throw new Error('build the CLI first: npm run build -w teamtrail');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'teamtrail-capture-'));
  // The folder name shows as the project name in the header.
  const dir = path.join(CODE, 'fieldnote-app');
  const billing = path.join(CODE, 'billing-service');
  const worktrees = `${dir}.teamtrail`;
  for (const d of [dir, billing, worktrees]) fresh(d);
  const data = path.join(dir, '.teamtrail');
  const config = path.join(tmp, 'config');
  const env = { ...process.env, TEAMTRAIL_DIR: data, TEAMTRAIL_CONFIG_DIR: config };
  execFileSync('npm', ['run', '--silent', 'seed'], { cwd: repo, env, stdio: 'ignore' });
  // The seed turns model matching on, and the scripted agents report no model (so they count as balanced) and would
  // never take the strongest-tier junctions they ask about. Start with it off; the captures switch it on in Settings.
  for (const entry of fs.readdirSync(data, { withFileTypes: true })) {
    const map = path.join(data, entry.name, 'map.md');
    if (!entry.isDirectory() || !fs.existsSync(map)) continue;
    fs.writeFileSync(map, fs.readFileSync(map, 'utf8').replace(/^model-matching: on$/m, 'model-matching: off'));
  }
  // A worktree per claimed ticket, the way a team running several agents works.
  fs.writeFileSync(path.join(data, 'workspaces.json'), `${JSON.stringify({ v: 1, worktrees: true }, null, 2)}\n`);
  gitRepo(dir);
  // The seed writes its second repo under the product repo's node_modules/.cache; copy it next to this one.
  fs.cpSync(path.join(repo, 'node_modules/.cache/teamtrail-dev-projects/billing-service'), billing, {
    recursive: true,
  });
  for (const root of [dir, billing])
    execFileSync(process.execPath, [cli, 'projects', 'add', root], { env, stdio: 'ignore' });

  const server = spawn(process.execPath, [cli, '--no-open', '--port', '0', '--dir', data], { cwd: dir, env });
  const url = await new Promise((resolve, reject) => {
    let out = '';
    server.stdout.on('data', (c) => {
      out += c;
      const m = out.match(/Lookout\s+(http:\S+)/);
      if (m) resolve(m[1]);
    });
    server.on('exit', (code) => reject(new Error(`teamtrail exited ${code}: ${out}`)));
  });

  const party = spawn(process.execPath, [path.join(repo, 'scripts/dev-agent.mjs'), String(agents)], { cwd: repo, env });
  let log = '';
  party.stdout.on('data', (c) => (log += c));
  party.stderr.on('data', (c) => (log += c));

  return {
    url,
    /** Agent output so far, for waiting on a step ("asking:", "closed #7"). */
    agentLog: () => log,
    stop() {
      party.kill();
      server.kill();
      for (const d of [tmp, dir, billing, worktrees]) {
        try {
          fs.rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
        } catch {
          // the server may still be flushing; the next run empties it
        }
      }
      // The code folder too, when the capture was all that was in it.
      try {
        fs.rmdirSync(CODE);
      } catch {
        // not empty, or already gone
      }
    },
  };
}
