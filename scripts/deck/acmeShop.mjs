// The acme-shop project the deck's demo video runs on: a small shop's checkout code with real tests (`npm test`),
// committed in git, and Teamtrail's check approved for it. The agents' code changes are real too: they write the
// files below, and Teamtrail runs the tests on them.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FILES = {
  'package.json': `${JSON.stringify(
    { name: 'acme-shop', private: true, type: 'module', scripts: { test: 'node --test' } },
    null,
    2,
  )}\n`,
  'README.md': '# Acme Shop\n\nThe checkout of a small online shop. Amounts are in cents.\n',
  'src/cart/totals.js': `// Cart totals, in cents.
export function subtotal(items) {
  return items.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
}

export function afterDiscounts(items, discounts = []) {
  const sub = subtotal(items);
  const off = discounts.reduce((sum, d) => sum + (d.percent ? Math.round((sub * d.percent) / 100) : d.cents), 0);
  return Math.max(0, sub - off);
}
`,
  'src/settings/store.js': `// Store settings. Amounts are in cents.
export const store = {
  currency: 'USD',
  flatShippingCents: 599,
};
`,
  'src/settings/regions.js': `// Where the store ships, and what shipping costs there, in cents.
export const regions = {
  US: { currency: 'USD', shippingCents: 599 },
  CA: { currency: 'CAD', shippingCents: 1299 },
};
`,
  'src/checkout/summary.js': `import { afterDiscounts } from '../cart/totals.js';
import { store } from '../settings/store.js';

/** The checkout's summary lines: the total after discounts and what shipping costs. */
export function summary(items, discounts = []) {
  const total = afterDiscounts(items, discounts);
  return { total, shipping: store.flatShippingCents };
}
`,
  'test/totals.test.js': `import assert from 'node:assert/strict';
import { test } from 'node:test';
import { afterDiscounts, subtotal } from '../src/cart/totals.js';

const cart = [{ priceCents: 2500, qty: 2 }];

test('subtotal adds every line', () => assert.equal(subtotal(cart), 5000));
test('a percent discount comes off the subtotal', () => assert.equal(afterDiscounts(cart, [{ percent: 10 }]), 4500));
`,
};

/** The agents' work, file by file: the threshold setting (#5) and free shipping at checkout (#6). */
export const CHANGES = {
  threshold: {
    'src/settings/store.js': `// Store settings. Amounts are in cents.
export const store = {
  currency: 'USD',
  flatShippingCents: 599,
  freeShippingThresholdCents: 5000,
};
`,
    'test/store.test.js': `import assert from 'node:assert/strict';
import { test } from 'node:test';
import { store } from '../src/settings/store.js';

test('free shipping starts at $50', () => assert.equal(store.freeShippingThresholdCents, 5000));
`,
  },
  checkout: {
    'src/checkout/summary.js': `import { afterDiscounts } from '../cart/totals.js';
import { store } from '../settings/store.js';

/** The checkout's summary lines: the total after discounts, shipping, and how far it is to free shipping. */
export function summary(items, discounts = []) {
  const total = afterDiscounts(items, discounts);
  const free = total >= store.freeShippingThresholdCents;
  return {
    total,
    shipping: free ? 0 : store.flatShippingCents,
    toFreeShipping: free ? 0 : store.freeShippingThresholdCents - total,
  };
}
`,
    'test/checkout.test.js': `import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summary } from '../src/checkout/summary.js';

test('$50 or more after discounts ships free', () => {
  assert.equal(summary([{ priceCents: 5000, qty: 1 }]).shipping, 0);
});
test('under $50 still pays $5.99 shipping', () => {
  assert.equal(summary([{ priceCents: 4000, qty: 1 }]).shipping, 599);
});
test('the discount counts: $55 with 10% off pays shipping', () => {
  const s = summary([{ priceCents: 5500, qty: 1 }], [{ percent: 10 }]);
  assert.equal(s.shipping, 599);
  assert.equal(s.toFreeShipping, 50);
});
`,
  },
};

/** Writes `files` (path → text) into `dir`. */
export function writeFiles(dir, files) {
  for (const [rel, text] of Object.entries(files)) {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
}

/** A fresh acme-shop at `dir`: the code, its tests, Teamtrail's check, one commit. */
export function makeAcmeShop(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  writeFiles(dir, FILES);
  writeFiles(dir, {
    '.teamtrail/verification.json': `${JSON.stringify(
      {
        v: 1,
        default: 'checks',
        checks: { tests: { run: ['npm', 'test', '--silent'], timeoutSec: 120 } },
        run: ['tests'],
      },
      null,
      2,
    )}\n`,
  });
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });
  git('init', '-q', '-b', 'main');
  git('-c', 'user.name=Acme', '-c', 'user.email=dev@acme.example', 'add', '-A');
  git('-c', 'user.name=Acme', '-c', 'user.email=dev@acme.example', 'commit', '-q', '-m', 'Checkout');
}
