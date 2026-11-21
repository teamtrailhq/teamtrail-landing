import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Every scene a page or partial names is one the scene index plays, and every scene's still frame is inside its loop.
const PAGES = [
  'index.html',
  'slack/index.html',
  'cloud/index.html',
  'mobile/index.html',
  'features/index.html',
  'guides/index.html',
];
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
  for (const name of ['mobile-needs', 'mobile-answer', 'mobile-merge', 'mobile-trails', 'mobile-notify'])
    assert.ok(
      named.some((n) => n.name === name),
      name,
    );
  assert.deepEqual(
    named.filter((n) => !registered.has(n.name)).map((n) => `${n.file}: ${n.name}`),
    [],
  );
});

test('every showcase card points at a pane that is a registered scene, and the page includes that pane', () => {
  const page = readFileSync('mobile/index.html', 'utf8');
  const panes = new Map(
    PARTIALS.flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/class="sc-pane[^"]*"\s+id="([\w-]+)"[^>]*data-scene="([\w-]+)"/g)].map(
        (m) => [m[1], { scene: m[2], partial: f.replace(/^partials\/|\.html$/g, '') }],
      ),
    ),
  );
  const cards = [...page.matchAll(/data-show\s+aria-controls="([\w-]+)"/g)].map((m) => m[1]);
  assert.equal(cards.length, 4);
  const wrong = cards.flatMap((id) => {
    const pane = panes.get(id);
    if (!pane) return [`${id}: no pane`];
    if (!registered.has(pane.scene)) return [`${id}: ${pane.scene} not registered`];
    if (!page.includes(`<!-- @include ${pane.partial} -->`)) return [`${id}: ${pane.partial} not on the page`];
    return [];
  });
  assert.deepEqual(wrong, []);
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
