// Overlay injected into the lookout page while the journey records: chapter label + caption,
// full-screen terminal / Claude Code windows that type their lines, and the title and end cards. The cards are wide,
// so they carry the teamtrail. wordmark, set as the site's nav sets it (Inter 600, tight, a blaze dot), never the square
// t. tile.
// Runs in the browser (page.addInitScript), so it must stay self-contained.
export function installStage({ scout, night }) {
  // A terminal in the site's own colours (src/styles.css): white and near-black surfaces, hairline borders, square
  // corners and one accent, blaze, on a dot grid like the site's heroes. Light by day and dark at night.
  const ink = night
    ? {
        page: '#0a0a0b',
        win: '#161618',
        line: 'rgba(255,255,255,.14)',
        dot: 'rgba(255,255,255,.06)',
        text: '#c9cbd0',
        hi: '#f4f4f6',
        dim: '#9a9ea6',
        ok: '#3fcf8e',
        acc: '#ff6b2c',
        shadow: 'rgba(0,0,0,.6)',
      }
    : {
        page: '#fafafa',
        win: '#ffffff',
        line: 'rgba(0,0,0,.14)',
        dot: 'rgba(0,0,0,.07)',
        text: '#3a3d44',
        hi: '#0e0f11',
        dim: '#62666e',
        ok: '#0e9f63',
        acc: '#c2410c',
        shadow: 'rgba(0,0,0,.12)',
      };
  const sans = "'Inter Variable',system-ui,sans-serif";
  const css = `
  #stage-cap{position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;
    align-items:center;gap:10px;pointer-events:none;transition:opacity .35s}
  #stage-cap b{font:500 13px 'JetBrains Mono Variable',ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:${ink.acc}}
  #stage-cap span{font:500 22px ${sans};letter-spacing:-.01em;color:${ink.hi};padding:12px 22px;background:${ink.win};
    border:1px solid ${ink.line};box-shadow:0 18px 50px ${ink.shadow}}
  #stage-ov{position:fixed;inset:0;z-index:9998;background:${ink.page};display:grid;place-items:center;transition:opacity .35s;
    background-image:radial-gradient(${ink.dot} 1px,transparent 1px);background-size:20px 20px;background-position:-10px -10px}
  #stage-ov.off{opacity:0;pointer-events:none}
  .st-win{width:1180px;height:640px;margin-bottom:90px;border:1px solid ${ink.line};overflow:hidden;background:${ink.win};display:flex;flex-direction:column;
    box-shadow:0 40px 100px -30px ${ink.shadow}}
  .st-bar{height:44px;display:flex;align-items:center;gap:8px;padding:0 18px;border-bottom:1px solid ${ink.line};
    font:500 14px ${sans};color:${ink.dim}}
    .st-bar em{font-style:normal}
  .st-body{flex:1;padding:24px 28px;overflow:hidden;font:400 19px/1.6 'JetBrains Mono Variable',ui-monospace,Menlo,monospace;color:${ink.text};white-space:pre-wrap}
  .st-body .dim{color:${ink.dim}}.st-body .ok{color:${ink.ok}}.st-body .acc{color:${ink.acc}}.st-body .scout{color:${ink.hi}}
  .st-body .user{color:${ink.hi}}.st-body .box{display:inline-block;border:1px solid ${ink.acc};padding:6px 14px;margin-bottom:6px}
.st-face{width:26px;height:26px;vertical-align:-7px}
  .st-cur{display:inline-block;width:10px;height:1.1em;vertical-align:-3px;background:#ff6b2c;animation:stb 1s steps(1) infinite}
  @keyframes stb{50%{opacity:0}}
  .st-card{display:flex;flex-direction:column;align-items:center;gap:26px;text-align:center}
  .st-card h1{margin:0 0 14px;font:600 128px/1 ${sans};letter-spacing:-.035em;color:${ink.hi}}
  .st-card h1 i{font-style:normal;color:#ff6b2c}
  .st-card p{margin:0;font:400 26px ${sans};color:${ink.text}}
  .st-card code{font:400 28px 'JetBrains Mono Variable',monospace;color:${ink.hi};background:${ink.win};padding:14px 24px;border:1px solid ${ink.line}}
  .st-card code span{color:${ink.acc}}
  .st-card small{font:500 15px 'JetBrains Mono Variable',monospace;letter-spacing:.1em;color:${ink.dim};text-transform:uppercase}`;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const el = (tag, attrs = {}, html = '') => Object.assign(document.createElement(tag), attrs, { innerHTML: html });
  let cap, ov;
  const ensure = () => {
    if (cap) return;
    document.head.append(el('style', {}, css));
    cap = el('div', { id: 'stage-cap' });
    ov = el('div', { id: 'stage-ov', className: 'off' });
    document.body.append(ov, cap);
  };
  window.__stage = {
    caption(label, text) {
      ensure();
      cap.style.opacity = text ? '1' : '0';
      if (text) cap.innerHTML = `<b>${label}</b><span>${text}</span>`;
    },
    hide() {
      ensure();
      ov.classList.add('off');
    },
    /** `copy` replaces the cards' English lines (the Polish deck demo): `tagline` on the title, `works` on the end. */
    card(kind, copy = {}) {
      ensure();
      const word = '<h1>teamtrail<i>.</i></h1>';
      const tagline = copy.tagline ?? 'The trail map for your AI coding agents.';
      const works = copy.works ?? 'Works with Claude Code, Codex and any MCP agent';
      ov.innerHTML =
        kind === 'title'
          ? `<div class="st-card">${word}<p>${tagline}</p></div>`
          : `<div class="st-card">${word}<code><span>$</span> npx teamtrail</code>
             <small>${works}</small><small>teamtrail.app</small></div>`;
      ov.classList.remove('off');
    },
    /** lines: [{ t, cls?, type?, pause? }]; `type` lines are typed after a prompt, the rest appear at once. */
    async term(title, lines, prompt = '~/fieldnote-app $ ') {
      ensure();
      ov.innerHTML = `<div class="st-win"><div class="st-bar"><em>${title}</em></div><div class="st-body"></div></div>`;
      ov.classList.remove('off');
      const body = ov.querySelector('.st-body');
      const cur = el('span', { className: 'st-cur' });
      body.append(cur);
      for (const l of lines) {
        const row = el('div', { className: l.cls ?? '' });
        body.insertBefore(row, cur);
        if (l.type) {
          row.append(el('span', { className: 'dim' }, l.prompt ?? prompt));
          const typed = el('span', { className: 'user' });
          row.append(typed, cur);
          await sleep(350);
          for (const ch of l.t) {
            typed.textContent += ch;
            await sleep(34);
          }
          await sleep(300);
          body.append(cur);
        } else
          row.innerHTML = (l.t || '&nbsp;')
            .replace(/^● Scout/, `<img class="st-face" src="${scout}" alt=""> Scout`)
            .replace(/^● Trail/, `<img class="st-face" src="${scout}" alt=""> Trail`);
        await sleep(l.pause ?? 110);
      }
    },
  };
}
