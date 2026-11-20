import { $ } from './dom';

/**
 * Mounts a widget on the element matching `sel`, and again whenever that element is replaced: a scene that holds it
 * puts its markup back after each turn, which leaves the old widget on a detached copy. The old one is destroyed.
 */
export function keepMounted(sel: string, mount: (host: HTMLElement) => { destroy(): void }) {
  let host = $(sel);
  if (!host) return;
  let widget = mount(host);
  const scope = host.closest('[data-scene]') ?? document.body;
  new MutationObserver(() => {
    const now = $(sel);
    if (!now || now === host) return;
    widget.destroy();
    host = now;
    widget = mount(now);
  }).observe(scope, { childList: true, subtree: true });
}
