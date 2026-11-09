import { $, $$ } from './dom';

/**
 * /guides: each card's Details opens its guide in a native modal dialog (showModal traps focus and closes on Esc).
 * A click on the backdrop or the close button closes it, and focus goes back to the Details control. Without JS,
 * Details is a plain link to the guide file.
 */
export function initGuideDialogs() {
  for (const opener of $$<HTMLAnchorElement>('[data-guide-dialog]')) {
    const dialog = document.getElementById(opener.dataset.guideDialog ?? '');
    if (!(dialog instanceof HTMLDialogElement) || typeof dialog.showModal !== 'function') continue;
    opener.setAttribute('role', 'button');
    opener.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      dialog.showModal();
      $<HTMLButtonElement>('[data-guide-close]', dialog)?.focus();
    });
    opener.addEventListener('keydown', (e) => {
      if (e.key !== ' ') return;
      e.preventDefault();
      opener.click();
    });
    dialog.addEventListener('close', () => opener.focus());
  }
  for (const dialog of $$<HTMLDialogElement>('dialog.gdlg')) {
    $('[data-guide-close]', dialog)?.addEventListener('click', () => dialog.close());
    // The dialog itself is only the target outside its inner panel, on the backdrop.
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  }
}
