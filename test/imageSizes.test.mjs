import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// Every page's <img src="/media/…png" width height> must have the shape of the file, so nothing jumps as it loads.
// Screenshots are re-captured (npm run media) and can change height; this names the page to fix.
const PAGES = [
  'index.html',
  ...readdirSync('.', { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(d.name, 'index.html')))
    .filter((d) => !['docs', 'dist', 'node_modules'].includes(d.name))
    .map((d) => join(d.name, 'index.html')),
];

/** A PNG's width and height, from its IHDR chunk. */
function pngSize(file) {
  const b = readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const imgs = (html) =>
  [...html.matchAll(/<img\s[^>]*?>/gs)].map((m) => ({
    src: /src="\/media\/([^"]+\.png)"/.exec(m[0])?.[1],
    w: Number(/width="(\d+)"/.exec(m[0])?.[1]),
    h: Number(/height="(\d+)"/.exec(m[0])?.[1]),
  }));

test("every screenshot's declared size has the file's shape", () => {
  const wrong = [];
  for (const page of PAGES) {
    for (const img of imgs(readFileSync(page, 'utf8'))) {
      if (!img.src || !img.w || !img.h) continue;
      const { w, h } = pngSize(join('public/media', img.src));
      // Within a pixel of the declared width's height (files are 1x or 2x).
      const expected = (img.w * h) / w;
      if (Math.abs(expected - img.h) > 1) wrong.push(`${page}: ${img.src} is ${w}x${h}, declared ${img.w}x${img.h}`);
    }
  }
  assert.deepEqual(wrong, []);
});
