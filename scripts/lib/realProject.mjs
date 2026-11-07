// A real Teamtrail project for the capture scripts, set up the way a user has one: the dev seed written into a
// temp folder, the built `teamtrail` server serving it, and real MCP agents (scripts/dev-agent.mjs) working it.
// Needs the product repo next to this one (../teamtrail, or TEAMTRAIL_REPO) with the CLI built: npm run build -w teamtrail.
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo =
  process.env.TEAMTRAIL_REPO ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../teamtrail');
const cli = path.join(repo, 'packages/cli/dist/cli.js');

/** Seeds a temp project, starts the server and `agents` MCP agents; `stop()` ends them and deletes the folder. */
export async function realProject({ agents = 2 } = {}) {
  if (!fs.existsSync(cli)) throw new Error('build the CLI first: npm run build -w teamtrail');
  // The folder name shows as the project name in the header.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'teamtrail-capture-'));
  const dir = path.join(tmp, 'fieldnote-app');
  fs.mkdirSync(dir);
  const data = path.join(dir, '.teamtrail');
  const env = { ...process.env, TEAMTRAIL_DIR: data };
  execFileSync('npm', ['run', '--silent', 'seed'], { cwd: repo, env, stdio: 'ignore' });

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
      try {
        fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      } catch {
        // the server may still be flushing; the OS cleans temp folders
      }
    },
  };
}
