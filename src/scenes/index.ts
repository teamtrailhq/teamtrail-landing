import { $$ } from '../dom';
import { chartScene } from './chartScene';
import { needsScene } from './needsScene';
import { parallelScene } from './parallelScene';
import { proofScene } from './proofScene';
import { scenePlayer, type Scene } from './sequencer';
import { takeTurns } from './turns';

const SCENES: Record<string, Scene> = {
  needs: needsScene,
  chart: chartScene,
  parallel: parallelScene,
  proof: proofScene,
};

/**
 * The product scenes (partials/scene-*.html) on this page, taking turns: one plays at a time, the others show their
 * still frame. With reduced motion, or without scripts, every scene keeps its still frame.
 */
export function initScenes(reducedMotion: boolean) {
  if (reducedMotion || !('IntersectionObserver' in window)) return;
  const players = $$('[data-scene]').flatMap((root) => {
    const scene = SCENES[root.dataset.scene ?? ''];
    return scene ? [scenePlayer(root, scene)] : [];
  });
  takeTurns(players);
}
