// Overlay injected into the lookout page while the journey records: chapter label + caption,
// full-screen terminal / Claude Code windows that type their lines, and the title and end cards.
// Runs in the browser (page.addInitScript), so it must stay self-contained.
export function installStage({ scout, logo, night }) {
  // A field-notebook terminal in the site's own colours, light by day and dark at night.
  const ink = night
    ? { page: '#131c18', win: '#17211c', line: 'rgba(150,170,155,.26)', text: '#c3cdc1', hi: '#eaeee3', dim: '#93a497', ok: '#8fbf84', acc: '#e8833a' }
    : { page: '#ede7d2', win: '#fbfaf4', line: 'rgba(76,78,58,.26)', text: '#38443c', hi: '#1b2620', dim: '#5e6a60', ok: '#3f6b45', acc: '#c8581e' };
  const css = `
  #stage-cap{position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;
    align-items:center;gap:10px;pointer-events:none;transition:opacity .35s}
  #stage-cap b{font:600 13px 'Figtree Variable',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${ink.acc}}
  #stage-cap span{font:500 22px 'Figtree Variable',system-ui,sans-serif;color:${ink.hi};padding:12px 22px;border-radius:8px;background:${ink.win};
    border:1px solid ${ink.line};box-shadow:0 18px 50px rgba(30,30,20,.28)}
  #stage-ov{position:fixed;inset:0;z-index:9998;background:${ink.page};display:grid;place-items:center;transition:opacity .35s}
  #stage-ov.off{opacity:0;pointer-events:none}
  .st-win{width:1180px;height:640px;margin-bottom:90px;border:1px solid ${ink.line};border-radius:12px;overflow:hidden;background:${ink.win};display:flex;flex-direction:column;
    box-shadow:0 40px 100px -30px rgba(30,30,20,.4)}
  .st-bar{height:44px;display:flex;align-items:center;gap:8px;padding:0 18px;border-bottom:1.5px dashed ${ink.line};
    font:500 14px 'Figtree Variable',sans-serif;color:${ink.dim}}
    .st-bar em{font-style:normal}
  .st-body{flex:1;padding:24px 28px;overflow:hidden;font:400 19px/1.6 'JetBrains Mono Variable',ui-monospace,Menlo,monospace;color:${ink.text};white-space:pre-wrap}
  .st-body .dim{color:${ink.dim}}.st-body .ok{color:${ink.ok}}.st-body .acc{color:${ink.acc}}.st-body .scout{color:${ink.hi}}
  .st-body .user{color:${ink.hi}}.st-body .box{display:inline-block;border:1.5px solid ${ink.acc};border-radius:6px;padding:6px 14px;margin-bottom:6px}
.st-face{width:26px;height:26px;vertical-align:-7px}
  .st-cur{display:inline-block;width:10px;height:1.1em;vertical-align:-3px;background:${ink.acc};animation:stb 1s steps(1) infinite}
  @keyframes stb{50%{opacity:0}}
  .st-card{display:flex;flex-direction:column;align-items:center;gap:26px;margin-bottom:60px;text-align:center}
  .st-card img{border-radius:50%;box-shadow:0 0 0 ${night ? '4px #f1e8d3' : '0 transparent'};width:170px;height:170px}
  .st-card h1{margin:0;font:900 110px 'Londrina Solid',sans-serif;letter-spacing:.018em;color:${night ? '#eaeee3' : '#1b2620'}}
  .st-card h1 span{color:${night ? '#e8833a' : '#c8581e'}}
  .st-card p{margin:0;font:400 26px 'Figtree Variable',sans-serif;color:${night ? '#c3cdc1' : '#38443c'}}
  .st-card code{font:400 28px 'JetBrains Mono Variable',monospace;color:${night ? '#eaeee3' : '#1b2620'};padding:14px 24px;border:1px solid ${night ? 'rgba(150,170,155,.32)' : 'rgba(76,78,58,.3)'}}
  .st-card code span{color:${night ? '#8fbf84' : '#3f6b45'}}
  .st-card small{font:400 15px 'Figtree Variable',sans-serif;letter-spacing:.1em;color:${night ? '#93a497' : '#5e6a60'};text-transform:uppercase}`;
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
    card(kind) {
      ensure();
      const word = '<h1>Teamtrail</h1>';
      ov.innerHTML =
        kind === 'title'
          ? `<div class="st-card"><img src="${logo}" alt="">${word}<p>The trail map for your AI coding agents.</p></div>`
          : `<div class="st-card"><img src="${logo}" alt="">${word}<code><span>$</span> npx teamtrail</code>
             <small>Works with Claude Code, Codex and any MCP agent</small><small>teamtrail.ai</small></div>`;
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
        } else row.innerHTML = (l.t || '&nbsp;').replace(/^● Scout/, `<img class="st-face" src="${scout}" alt=""> Scout`).replace(/^● Trail/, `<img class="st-face" src="${scout}" alt=""> Trail`);
        await sleep(l.pause ?? 110);
      }
    },
  };
}
