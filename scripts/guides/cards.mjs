// Renders the guide catalog (scripts/guides/catalog.mjs) as the cards on /guides, at build time.
const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** The built-in guides have their own badge art; every other guide gets the community one. */
const BADGES = { reviewer: 'thinking', qa: 'idle', security: 'alert', docs: 'idle', architect: 'thinking' };
const VISIBLE_ITEMS = 3;

const COPY_ICONS = `<svg class="ico i-copy" viewBox="0 0 20 20" aria-hidden="true"><rect x="6.5" y="6.5" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" /><path d="M13.5 3.5h-10v10" fill="none" stroke="currentColor" stroke-width="1.5" /></svg><svg class="ico i-check" viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10.5 4 4 8-9" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>`;

function badge(id) {
  const known = id in BADGES;
  return `<span class="spec spec--${known ? id : 'you'}" data-spec="${known ? BADGES[id] : 'idle'}" aria-hidden="true"></span>`;
}

function status(g) {
  if (g.reported) return '<span class="tag tag--soon">Reported</span>';
  if (g.builtin) return '<span class="tag tag--now">Built in</span>';
  if (g.verified) return '<span class="tag tag--now">Verified</span>';
  return '<span class="tag">Not reviewed</span>';
}

function checklist(items) {
  if (!items.length) return '';
  const li = (s) => `<li>${esc(s)}</li>`;
  const shown = items.slice(0, VISIBLE_ITEMS).map(li).join('');
  const rest = items.slice(VISIBLE_ITEMS);
  const more = rest.length
    ? `<details class="gcard__more"><summary>${rest.length} more</summary><ul class="gcard__list" role="list">${rest.map(li).join('')}</ul></details>`
    : '';
  return `<div class="gcard__block"><h4>Checklist</h4><ul class="gcard__list" role="list">${shown}</ul>${more}</div>`;
}

function checks(list) {
  if (!list.length) return `<p class="gcard__checks">Adds no checks of its own.</p>`;
  const one = (c) =>
    c.run
      ? `<code>${esc(c.name)}</code> runs <code>${esc(c.run)}</code>`
      : `needs your <code>${esc(c.name)}</code> check`;
  return `<p class="gcard__checks">Adds a check: ${list.map(one).join('; ')}. It runs only after you approve it.</p>`;
}

function install(g) {
  if (g.builtin) return `<p class="gcard__builtin">Built in, nothing to add</p>`;
  const cmd = `npx teamtrail@next guides add ${g.id}`;
  return `<div class="cmd cmd--static"><span class="cmd__line"><span class="prompt" aria-hidden="true">$</span> <span class="cmd__text">${esc(cmd)}</span></span><button class="copy" type="button" data-copy="${esc(cmd)}" aria-label="Copy the command to add ${esc(g.name)}">${COPY_ICONS}</button></div>`;
}

function card(g) {
  return `<article class="gcard reveal" id="guide-${esc(g.id)}">
  <header class="gcard__head">${badge(g.id)}<div><h3>${esc(g.name)}</h3><span class="gcard__by">by ${esc(g.author)} · v${esc(g.version)}</span></div>${status(g)}</header>
  <p class="gcard__summary">${esc(g.summary)}</p>
  ${checklist(g.checklist)}
  ${checks(g.checks)}
  <footer class="gcard__foot">${install(g)}<a class="gcard__src" href="${esc(g.source)}">View the guide file <span class="arrow" aria-hidden="true">→</span></a></footer>
</article>`;
}

export function renderGuideCards(catalog) {
  return `<div class="gcards">${catalog.guides.map(card).join('\n')}</div>`;
}
