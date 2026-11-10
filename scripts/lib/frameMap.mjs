// Frames part of the trail map for a capture, the way a person would: Fit, then zoom with the wheel around the
// cards and drag the map until they sit in the middle of the map zone. Shared by media.mjs and journey.mjs.

/**
 * The cards `pick` chooses: by key (`#6`), plus with `added` the plan's new cards among those columns, plus with
 * `destination` the destination mark. Returns their bounding box on the page.
 */
const union = (page, pick) =>
  page.evaluate((pick) => {
    const nodes = [...document.querySelectorAll('.map-zone .node')];
    const keyOf = (n) => n.querySelector('.key')?.textContent?.trim();
    const keyed = nodes.filter((n) => pick.keys.includes(keyOf(n)));
    const lefts = keyed.map((n) => n.getBoundingClientRect().left);
    const [lo, hi] = [Math.min(...lefts), Math.max(...lefts)];
    const isAdded = (n) => {
      const left = n.getBoundingClientRect().left;
      return /mark-added/.test(n.getAttribute('class')) && left >= lo - 1 && left <= hi + 1;
    };
    const picked = [...keyed, ...(pick.added ? nodes.filter(isAdded) : [])];
    if (pick.destination) picked.push(document.querySelector('.map-zone .destination'));
    const rects = picked.map((n) => n.getBoundingClientRect());
    const x0 = Math.min(...rects.map((r) => r.left));
    const y0 = Math.min(...rects.map((r) => r.top));
    const x1 = Math.max(...rects.map((r) => r.right));
    const y1 = Math.max(...rects.map((r) => r.bottom));
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  }, pick);

/** The map's own area: below the zone header and the reroute banner. */
const mapArea = (page) =>
  page.evaluate(() => {
    const zone = document.querySelector('.map-zone').getBoundingClientRect();
    const svg = document.querySelector('.map-zone svg.graph').getBoundingClientRect();
    return { x: zone.x, y: svg.y, width: zone.width, height: zone.bottom - svg.y };
  });

/** Drags the map so the picked cards sit in the middle of the area, grabbing it where no card or button is. */
async function centre(page, pick, area) {
  const u = await union(page, pick);
  const from = await page.evaluate((a) => {
    for (let fy = 0.1; fy < 1; fy += 0.1)
      for (let fx = 0.1; fx < 1; fx += 0.1) {
        const p = { x: a.x + a.width * fx, y: a.y + a.height * fy };
        const el = document.elementFromPoint(p.x, p.y);
        if (el?.closest('.map-zone svg.graph') && !el.closest('.node, button, a')) return p;
      }
    return { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  }, area);
  const dx = area.x + area.width / 2 - (u.x + u.width / 2);
  const dy = area.y + area.height / 2 - (u.y + u.height / 2);
  // A press and release without a move is a click on the map, which clears the selected ticket.
  if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + dx, from.y + dy, { steps: 12 });
  await page.mouse.up();
  // A drag that strays off the map selects text; drop it.
  await page.evaluate(() => window.getSelection()?.removeAllRanges());
  await page.waitForTimeout(700);
}

/**
 * Waits until no card is half-made: a card for a ticket an agent is creating or closing can show for a moment with
 * no title or number, and the map moves to make room for it.
 */
async function wholeCards(page) {
  for (let t = 0; t < 40; t++) {
    const blank = await page.evaluate(() =>
      [...document.querySelectorAll('.map-zone .node')].some(
        (n) => !n.querySelector('.title')?.textContent?.trim() || !/\d|\+/.test(n.querySelector('.key')?.textContent),
      ),
    );
    if (!blank) return;
    await page.waitForTimeout(500);
  }
}

/** Frames the picked cards so they fill `fill` of the map area. */
export async function frameMap(page, pick, fill = 0.94) {
  await wholeCards(page);
  await page.locator('.map-zone').getByRole('button', { name: 'Fit' }).click();
  await page.waitForTimeout(900);
  const area = await mapArea(page);
  // Zoom towards the size that fills the area, then centre; twice, since the map eases its zoom.
  for (let pass = 0; pass < 2; pass++) {
    await centre(page, pick, area);
    const u = await union(page, pick);
    const k = Math.min((area.width * fill) / u.width, (area.height * fill) / u.height);
    await page.mouse.move(u.x + u.width / 2, u.y + u.height / 2);
    // Wheel zoom is exp(-deltaY * 0.0015) per event; small steps, as a person scrolls.
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, -Math.log(k) / 0.0015 / steps);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(700);
  }
  await centre(page, pick, area);
  await page.waitForTimeout(300);
}

/** Titles of the cards the map area cuts through (partly in view), so a capture can refuse a clipped frame. */
export async function clippedCards(page) {
  const area = await mapArea(page);
  return page.evaluate((a) => {
    const [x1, y1] = [a.x + a.width, a.y + a.height];
    return [...document.querySelectorAll('.map-zone .node')]
      .map((n) => ({ n, r: n.getBoundingClientRect() }))
      .filter(({ r }) => r.right > a.x && r.left < x1 && r.bottom > a.y && r.top < y1)
      .filter(({ r }) => r.left < a.x || r.right > x1 || r.top < a.y || r.bottom > y1)
      .map(({ n }) => n.querySelector('.title')?.textContent?.trim() ?? '?');
  }, area);
}
