import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Every scene a page or partial names is one the scene index plays, and every scene's still frame is inside its loop.
const PAGES = ['index.html', 'slack/index.html', 'cloud/index.html', 'features/index.html', 'guides/index.html'];
const PARTIALS = readdirSync('partials').map((f) => join('partials', f));
const named = [...PAGES, ...PARTIALS].flatMap((f) =>
  [...readFileSync(f, 'utf8').matchAll(/data-scene="([\w-]+)"/g)].map((m) => ({ file: f, name: m[1] })),
);
const index = readFileSync('src/scenes/index.ts', 'utf8');
const registry = index.slice(index.indexOf('const SCENES'), index.indexOf('};'));
const registered = new Set([...registry.matchAll(/^\s+'?([\w-]+)'?: \w+,$/gm)].map((m) => m[1]));

test('every data-scene on the site is a registered scene', () => {
  assert.ok(named.some((n) => n.name === 'slack-answer'));
  assert.ok(named.some((n) => n.name === 'cloud-away'));
  assert.deepEqual(
    named.filter((n) => !registered.has(n.name)).map((n) => `${n.file}: ${n.name}`),
    [],
  );
});

test("each scene's loop is 9 to 11 s, and its still frame and steps fall inside it", () => {
  const wrong = [];
  for (const f of readdirSync('src/scenes').filter((f) => f.endsWith('Scene.ts'))) {
    const src = readFileSync(join('src/scenes', f), 'utf8');
    const length = Number(/length: (\d+)/.exec(src)?.[1]);
    const still = Number(/still: (\d+)/.exec(src)?.[1] ?? length);
    if (length < 9000 || length > 11000) wrong.push(`${f}: loop ${length}`);
    if (still > length) wrong.push(`${f}: still ${still} after the loop`);
    for (const [, at] of src.matchAll(/^\s+\[\s*(\d+),/gm)) if (Number(at) >= length) wrong.push(`${f}: step at ${at}`);
  }
  assert.deepEqual(wrong, []);
});

test('scenes keep their still frames before Scout is mounted in them (style attributes break the CSP)', () => {
  const main = readFileSync('src/main.ts', 'utf8');
  assert.ok(main.indexOf('initScenes(reducedMotion)') > 0);
  assert.ok(main.indexOf('initScenes(reducedMotion)') < main.indexOf('initCloudScene(reducedMotion)'));
});
