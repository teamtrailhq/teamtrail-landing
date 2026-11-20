import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { takeTurns } from '../src/scenes/turns.ts';

// Just enough of a page: an IntersectionObserver driven by the test, the tab's visibility and document order.
let observer;
let listeners;
globalThis.Node = { DOCUMENT_POSITION_FOLLOWING: 4 };
globalThis.IntersectionObserver = class {
  constructor(callback) {
    observer = { callback };
  }
  observe() {}
};
globalThis.document = {
  hidden: false,
  addEventListener: (type, fn) => listeners.push(fn),
};

const log = [];
/** A scene at `pos` in document order whose turn ends when the test calls its `finish`. */
function player(name, pos) {
  const root = { pos, compareDocumentPosition: (other) => (other.pos > pos ? 4 : 2) };
  const p = {
    name,
    root,
    play: (done) => {
      log.push(`play ${name}`);
      p.finish = done;
    },
    stop: () => log.push(`stop ${name}`),
  };
  return p;
}
const show = (players, on) => observer.callback(players.map((p) => ({ target: p.root, isIntersecting: on })));
const setHidden = (hidden) => {
  document.hidden = hidden;
  for (const fn of listeners) fn();
};

let a, b, c;
beforeEach(() => {
  log.length = 0;
  listeners = [];
  document.hidden = false;
  [a, b, c] = [player('a', 1), player('b', 2), player('c', 3)];
  takeTurns([c, a, b]);
});

test('the scenes on screen take turns in document order, one at a time', () => {
  show([c, b, a], true);
  a.finish();
  b.finish();
  c.finish();
  assert.deepEqual(log, ['play a', 'play b', 'play c', 'play a']);
});

test('a scene alone on screen loops', () => {
  show([b], true);
  b.finish();
  b.finish();
  assert.deepEqual(log, ['play b', 'play b', 'play b']);
});

test('a scene that leaves mid-turn stops and hands to the next one on screen', () => {
  show([a, b], true);
  show([a], false);
  assert.deepEqual(log, ['play a', 'stop a', 'play b']);
});

test('a scene coming on screen waits for its turn', () => {
  show([a], true);
  show([c], true);
  a.finish();
  assert.deepEqual(log, ['play a', 'play c']);
});

test('nothing plays while the tab is hidden', () => {
  show([a, b], true);
  setHidden(true);
  show([c], true);
  setHidden(false);
  assert.deepEqual(log, ['play a', 'stop a', 'play a']);
});
