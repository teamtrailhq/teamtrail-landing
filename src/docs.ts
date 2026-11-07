// Docs pages only: copy buttons on code blocks, the Copy page menu (Markdown, ChatGPT, Claude) and the sidebar
// toggle on small screens. The pages themselves are rendered at build time (scripts/docs).
import { $, $$ } from './dom';

const SITE = 'https://teamtrail.ai';

/** Copies text and flashes the button's label, so the copy is confirmed where it happened. */
async function copyWithFeedback(button: HTMLElement, text: string) {
  const label = button.querySelector('strong') ?? button;
  const before = label.textContent;
  try {
    await navigator.clipboard.writeText(text);
    label.textContent = 'Copied';
  } catch {
    label.textContent = 'Copy failed';
  }
  setTimeout(() => (label.textContent = before), 1600);
}

function initCodeCopy() {
  for (const button of $$<HTMLButtonElement>('.code__copy')) {
    button.addEventListener('click', () => {
      const code = button.closest('.code')?.querySelector('code')?.textContent ?? '';
      void copyWithFeedback(button, code);
    });
  }
}

function initCopyMenu() {
  const root = $('[data-docs-copy]');
  if (!root) return;
  const md = root.dataset.md ?? '';
  const toggle = root.querySelector<HTMLButtonElement>('.docs-copy__toggle');
  const menu = root.querySelector<HTMLElement>('.docs-copy__menu');
  if (!toggle || !menu) return;

  const setOpen = (open: boolean) => {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(menu.hidden !== false));
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target as Node)) setOpen(false);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      toggle.focus();
    }
  });

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-copy-md]')) {
    button.addEventListener('click', async () => {
      const text = await fetch(md).then((r) => r.text());
      await copyWithFeedback(button, text);
    });
  }
  const prompt = encodeURIComponent(`Read ${SITE}${md} and answer my questions about it.`);
  const urls: Record<string, string> = {
    chatgpt: `https://chatgpt.com/?q=${prompt}`,
    claude: `https://claude.ai/new?q=${prompt}`,
  };
  for (const link of root.querySelectorAll<HTMLAnchorElement>('[data-llm]')) {
    link.href = urls[link.dataset.llm ?? ''] ?? '#';
  }
}

function initSidebarToggle() {
  const button = $<HTMLButtonElement>('.docs-menu-btn');
  const nav = $('#docs-nav');
  if (!button || !nav) return;
  button.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Close' : 'Docs menu';
  });
}

initCodeCopy();
initCopyMenu();
initSidebarToggle();
