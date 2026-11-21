import { scenePlayer, type Scene } from './sequencer';
import type { Player } from './turns';

/**
 * /mobile's showcase: one phone and the cards around it (`[data-showcase]`). Each card is a button for one pane on the
 * phone's screen, and each pane is a scene. Choosing a card (hover, focus or a press) shows its pane with a quick
 * crossfade and plays its scene from the start, taking the page's turn (./turns). Left alone on screen, the showcase
 * plays the chosen scene and moves to the next card after each turn; a pointer or focus inside it holds the card.
 * Without motion the cards still switch the panes, each showing its still frame.
 */
interface Item {
  button: HTMLButtonElement;
  pane: HTMLElement;
  line: string;
  player?: Player;
}

export interface Showcase {
  player: Player;
  /** How the showcase takes the page's turn when someone chooses a card. */
  onClaim(claim: (player: Player) => void): void;
}

export function initShowcase(root: HTMLElement, scenes: Record<string, Scene>, motion: boolean): Showcase {
  const caption = root.querySelector('.showcase__caption');
  const items: Item[] = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-show]')).flatMap((button) => {
    const pane = document.getElementById(button.getAttribute('aria-controls') ?? '');
    if (!pane) return [];
    const scene = scenes[pane.dataset.scene ?? ''];
    const line = button.querySelector('.sc-card__line')?.textContent ?? '';
    return [{ button, pane, line, player: motion && scene ? scenePlayer(pane, scene) : undefined }];
  });
  let index = Math.max(
    0,
    items.findIndex((it) => it.button.getAttribute('aria-pressed') === 'true'),
  );
  let held = false;
  let live = false;
  let claim: ((player: Player) => void) | undefined;

  const show = (i: number) => {
    index = i;
    items.forEach((it, j) => {
      const on = j === i;
      it.button.setAttribute('aria-pressed', String(on));
      it.pane.classList.toggle('is-shown', on);
      it.pane.setAttribute('aria-hidden', String(!on));
    });
    if (caption) caption.textContent = items[i]?.line ?? '';
  };

  const player: Player = {
    root,
    play(done) {
      const item = items[index];
      if (!item?.player) return done();
      live = true;
      item.player.play(() => {
        live = false;
        if (!held) show((index + 1) % items.length);
        done();
      });
    },
    stop() {
      live = false;
      items[index]?.player?.stop();
    },
  };

  const choose = (i: number) => {
    if (i === index && (live || !motion)) return;
    items[index]?.player?.stop();
    live = false;
    show(i);
    claim?.(player);
  };
  items.forEach((it, i) => {
    it.button.addEventListener('click', () => choose(i));
    it.button.addEventListener('mouseenter', () => choose(i));
    it.button.addEventListener('focus', () => choose(i));
  });
  // A keyboard focus holds the card; a click's focus doesn't, once the pointer leaves.
  const keyboardFocus = () => root.querySelector(':focus-visible') !== null;
  root.addEventListener('pointerenter', () => (held = true));
  root.addEventListener('pointerleave', () => (held = keyboardFocus()));
  root.addEventListener('focusin', () => (held = held || keyboardFocus()));
  root.addEventListener('focusout', () => queueMicrotask(() => (held = keyboardFocus())));

  show(index);
  return { player, onClaim: (c) => (claim = c) };
}
