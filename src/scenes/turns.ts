/**
 * Scenes take turns: one plays at a time on the whole page. The scenes on screen queue in document order; the playing
 * one runs a full turn, then hands to the next one on screen (to itself when it is alone). A scene that leaves the
 * screen stops and hands over, and nothing plays while the tab is hidden. The others show their still frame.
 * `claim` lets a scene someone chose (the /mobile showcase) take the turn at once, from the one playing.
 */
export interface Player {
  root: HTMLElement;
  /** Plays one turn, from the still frame round to it, then calls `done`. */
  play(done: () => void): void;
  /** Stops at once, back on the still frame. */
  stop(): void;
}

const before = (a: Player, b: Player) =>
  a.root.compareDocumentPosition(b.root) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

export function takeTurns(players: Player[]): { claim(player: Player): void } {
  const order = [...players].sort(before);
  const byRoot = new Map<Element, Player>(order.map((p) => [p.root, p]));
  const onScreen = new Set<Player>();
  let playing: Player | undefined;

  /** The first scene on screen after `from` in document order, wrapping round. */
  const nextAfter = (from?: Player) => {
    const shown = order.filter((p) => onScreen.has(p));
    const i = from ? order.indexOf(from) : -1;
    return shown.find((p) => order.indexOf(p) > i) ?? shown[0];
  };
  const handOver = (from?: Player) => {
    const next = document.hidden ? undefined : nextAfter(from);
    playing = next;
    next?.play(() => handOver(next));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        const player = byRoot.get(target);
        if (player && isIntersecting) onScreen.add(player);
        if (player && !isIntersecting) onScreen.delete(player);
      }
      const left = playing && !onScreen.has(playing) ? playing : undefined;
      left?.stop();
      if (left || !playing) handOver(left);
    },
    { threshold: 0.2 },
  );
  for (const p of order) observer.observe(p.root);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      if (!playing) handOver();
      return;
    }
    playing?.stop();
    playing = undefined;
  });

  return {
    claim(player) {
      if (document.hidden || !onScreen.has(player)) return;
      playing?.stop();
      playing = player;
      player.play(() => handOver(player));
    },
  };
}
