// The deck demo's agents: real MCP clients of the built `teamtrail mcp`, connected the way Claude Code connects.
// Like Claude Code, each keeps a session transcript that holds every message's model and API usage, so the Lookout
// shows the agent's model tier and spend. Nothing a tool returns is invented here.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Per message, as a Claude Code turn with a warm cache looks. */
const USAGE = {
  input_tokens: 900,
  cache_creation_input_tokens: 1200,
  cache_read_input_tokens: 9000,
  output_tokens: 420,
};

/** The MCP SDK from the product repo, which the demo runs against. */
async function sdk(repo) {
  const req = createRequire(path.join(repo, 'package.json'));
  const load = (p) => import(pathToFileURL(req.resolve(p)).href);
  const [{ Client }, { StdioClientTransport }] = await Promise.all([
    load('@modelcontextprotocol/sdk/client/index.js'),
    load('@modelcontextprotocol/sdk/client/stdio.js'),
  ]);
  return { Client, StdioClientTransport };
}

/** One agent named `name` (claude-01) on `model`, in `dir`, with its Claude config under `home`. */
export async function connectAgent({ repo, cli, dir, home, env, name, model }) {
  const { Client, StdioClientTransport } = await sdk(repo);
  const config = path.join(home, `claude-${name}`);
  const transcript = path.join(config, 'projects', dir.replace(/[^a-zA-Z0-9]/g, '-'), `${name}.jsonl`);
  fs.mkdirSync(path.dirname(transcript), { recursive: true });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [cli, 'mcp', '--agent', name],
    cwd: dir,
    stderr: 'pipe',
    env: { ...env, CLAUDE_CONFIG_DIR: config, CLAUDE_PROJECT_DIR: dir },
  });
  const client = new Client({ name: 'claude-code', version: '2.1.0' });
  await client.connect(transport);
  let seq = 0;
  /** Calls `tool`; `turns` is how many model messages led to the call (reading, thinking), for the transcript. */
  const call = async (tool, args = {}, { turns = 1 } = {}) => {
    const id = `toolu_${name}_${Date.now().toString(36)}_${seq++}`;
    for (let t = 0; t < turns; t++) {
      const last = t === turns - 1;
      const message = {
        id: `msg_${name}_${seq}_${t}`,
        type: 'message',
        role: 'assistant',
        model,
        content: last ? [{ type: 'tool_use', id, name: `mcp__teamtrail__${tool}`, input: args }] : [],
        usage: USAGE,
      };
      fs.appendFileSync(
        transcript,
        `${JSON.stringify({ type: 'assistant', timestamp: new Date().toISOString(), requestId: `req_${name}_${seq}_${t}`, message })}\n`,
      );
    }
    const r = await client.callTool({ name: tool, arguments: args, _meta: { 'claudecode/toolUseId': id } }, undefined, {
      timeout: 15 * 60_000,
    });
    if (r.isError) throw new Error(`${name} ${tool}: ${r.content[0].text}`);
    await new Promise((done) => setTimeout(done, 5));
    return JSON.parse(r.content[0].text);
  };
  return { name, call, close: () => client.close().catch(() => {}) };
}
